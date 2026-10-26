import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { CodeRunner } from '../src/exercise/code-runner.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeCodeRunner } from './fake-code-runner.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string; type: string; isPublished: boolean }[] }[] };
type Summary = { id: string; status: string; score: number };

describe('Học viên làm bài code (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const amqp = { publish: vi.fn().mockResolvedValue(true) };
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let stu: TestUser; // học viên đã ghi danh
  let dave: TestUser; // học viên đã ghi danh, người khác
  let carol: TestUser; // chưa ghi danh
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let item: string; // bài code đã xuất bản
  let draftItem: string; // bài code chưa xuất bản
  let sub1: string;
  let sub2: string;
  let sub3: string;
  let tests: { id: string; position: number }[];

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const as = (method: Method, path: string, body?: object) =>
    call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
  const addItem = async (type: string, title: string) => {
    const tree = (await as('post', `/sections/${sectionId}/items`, { type, title }).expect(201)).body as Tree;
    return tree.sections[0].items.at(-1)!.id;
  };
  const learn = (method: Method, path = '', user = stu, body?: object, itemId = item) =>
    call(method, `/api/learn/${slug}/exercises/${itemId}${path}`, user.cookie, body);
  const code = (sourceCode: string, language = 'javascript') => ({ language, sourceCode });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .overrideProvider(CodeRunner)
      .useValue(new FakeCodeRunner())
      .overrideProvider(AmqpConnection)
      .useValue(amqp)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, stu, dave, carol] = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e học bài code' }).expect(201))
      .body.id as string;
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    item = await addItem('coding_exercise', 'Tổng hai số');
    draftItem = await addItem('coding_exercise', 'Bài nháp');
    await as('put', `/items/${item}/exercise/code`, {
      languages: ['javascript', 'cpp'],
      starters: [
        { language: 'javascript', code: '// starter', solutionCode: 'SUM' },
        { language: 'cpp', code: '// cpp', solutionCode: 'SUM' },
      ],
      tests: [
        { input: '1 2', expectedOutput: '3', isPublic: true, points: 1 },
        { input: '2 3', expectedOutput: '5', isPublic: false, points: 3 },
      ],
    }).expect(200);
    expect((await as('post', `/items/${item}/exercise/verify`).expect(200)).body.passed).toBe(true);
    const [course, exercise] = await Promise.all([
      prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } }),
      prisma.exercise.findUniqueOrThrow({
        where: { itemId: item },
        select: { testCases: { orderBy: { position: 'asc' }, select: { id: true, position: true } } },
      }),
      prisma.enrollment.createMany({ data: [stu, dave].map((u) => ({ userId: u.id, courseId })) }),
    ]);
    slug = course.slug;
    tests = exercise.testCases;
  }, SLOW);

  // course cascade → exercise/submission/enrollment; user cascade → submission còn lại.
  afterAll(async () => {
    const ids = [alice, stu, dave, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'chưa ghi danh → 403 NOT_ENROLLED; bài chưa xuất bản / không phải uuid → 404',
    async () => {
      expect((await learn('get', '', carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await learn('get', '', stu, undefined, draftItem).expect(404)).body.code).toBe('EXERCISE_NOT_FOUND');
      await learn('get', '', stu, undefined, 'abc').expect(404);
    },
    SLOW,
  );

  it(
    'GET: starter + test công khai, không lộ test ẩn / lời giải',
    async () => {
      const { body } = await learn('get').expect(200);
      expect(body).toMatchObject({
        itemId: item,
        title: 'Tổng hai số',
        hiddenTestCount: 1,
        solution: null,
        completed: false,
        bestScore: null,
        languages: ['javascript', 'cpp'],
      });
      expect(body.starters.javascript).toBe('// starter');
      expect(body.publicTests).toHaveLength(1);
      expect(body.publicTests[0]).toMatchObject({ input: '1 2', expectedOutput: '3' });
      const json = JSON.stringify(body);
      expect(json).not.toContain('2 3');
      expect(json).not.toContain('SUM');
    },
    SLOW,
  );

  it(
    'POST /run: chạy test công khai; ngôn ngữ / code sai → 400; runner sập → 503; quá 10 lần/phút → 429',
    async () => {
      const { body } = await learn('post', '/run', stu, code('SUM')).expect(200);
      expect(body.compileError).toBeNull();
      expect(body.tests).toHaveLength(1);
      expect(body.tests[0]).toMatchObject({ input: '1 2', expectedOutput: '3', status: 'accepted', stdout: '3\n' });
      await learn('post', '/run', stu, code('SUM', 'python')).expect(400); // bài không dùng python
      await learn('post', '/run', stu, code('   ')).expect(400);
      await learn('post', '/run', stu, code('SU\u0000M')).expect(400); // Postgres text không nhận NUL
      expect((await learn('post', '/run', stu, code('DOWN')).expect(503)).body.code).toBe('RUNNER_UNAVAILABLE');

      const redis = app.get(RedisService);
      const key = `rl:exercise-run:${stu.id}`;
      await redis.set(key, 10, 'EX', 60);
      try {
        expect((await learn('post', '/run', stu, code('SUM')).expect(429)).body.code).toBe('RATE_LIMITED');
      } finally {
        await redis.del(key);
      }
    },
    SLOW,
  );

  it(
    'POST /run: đang có một lần chạy của chính user → 429; khoá nhả sau khi xong',
    async () => {
      const redis = app.get(RedisService);
      const key = `lock:exercise-run:${stu.id}`;
      await redis.set(key, '1', 'EX', 60);
      try {
        expect((await learn('post', '/run', stu, code('SUM')).expect(429)).body.code).toBe('RATE_LIMITED');
      } finally {
        await redis.del(key);
      }
      await learn('post', '/run', stu, code('SUM')).expect(200);
      expect(await redis.exists(key)).toBe(0);
    },
    SLOW,
  );

  it(
    'POST /submissions: 202 + pending + đẩy job; ngôn ngữ sai → 400',
    async () => {
      await learn('post', '/submissions', stu, code('SUM', 'python')).expect(400);
      expect(amqp.publish).not.toHaveBeenCalled();
      const res = await learn('post', '/submissions', stu, code('SUM')).expect(202);
      sub1 = res.body.id as string;
      expect(sub1).toBeTruthy();
      expect(amqp.publish).toHaveBeenCalledWith(
        '',
        'submission.grade',
        { submissionId: sub1, attempt: 1 },
        expect.objectContaining({ persistent: true }),
      );
      const row = await prisma.submission.findUniqueOrThrow({ where: { id: sub1 } });
      expect([row.status, row.totalTests, row.language]).toEqual(['pending', 2, 'javascript']);
    },
    SLOW,
  );

  it(
    'nộp khi đang có bài chờ chấm → 409 SUBMISSION_IN_PROGRESS kèm bài đang chờ',
    async () => {
      const res = await learn('post', '/submissions', stu, code('SUM')).expect(409);
      expect(res.body).toMatchObject({ statusCode: 409, code: 'SUBMISSION_IN_PROGRESS', submissionId: sub1, itemId: item, courseSlug: slug });
    },
    SLOW,
  );

  it(
    'bài chờ chấm ở bài tập khác vẫn chặn, trả itemId của bài đó',
    async () => {
      const draft = await prisma.exercise.findUniqueOrThrow({ where: { itemId: draftItem }, select: { id: true } });
      const other = await prisma.submission.create({
        data: { exerciseId: draft.id, userId: dave.id, language: 'javascript', sourceCode: 'SUM', totalTests: 0 },
        select: { id: true },
      });
      const res = await learn('post', '/submissions', dave, code('SUM')).expect(409);
      expect(res.body).toMatchObject({ code: 'SUBMISSION_IN_PROGRESS', submissionId: other.id, itemId: draftItem, courseSlug: slug });
    },
    SLOW,
  );

  it(
    'bài kẹt quá 5 phút → nhả suất, nộp lại được; bài cũ internal_error',
    async () => {
      await prisma.submission.update({ where: { id: sub1 }, data: { submittedAt: new Date(Date.now() - 6 * 60_000) } });
      const res = await learn('post', '/submissions', stu, code('SUM')).expect(202);
      sub2 = res.body.id as string;
      expect(sub2).not.toBe(sub1);
      const old = await prisma.submission.findUniqueOrThrow({ where: { id: sub1 } });
      expect(old.status).toBe('internal_error');
      expect(old.gradedAt).not.toBeNull();
    },
    SLOW,
  );

  it(
    'publish lỗi → 503 GRADER_UNAVAILABLE, bài vừa tạo internal_error',
    async () => {
      // nhả suất bằng cách coi bài đang chờ như đã chấm xong (cũng là bài accepted cho case sau).
      await prisma.submission.update({ where: { id: sub2 }, data: { status: 'accepted', score: 100 } });
      amqp.publish.mockRejectedValueOnce(new Error('down'));
      const res = await learn('post', '/submissions', stu, code('SUM')).expect(503);
      expect(res.body.code).toBe('GRADER_UNAVAILABLE');
      const rows = await prisma.submission.findMany({
        where: { userId: stu.id, id: { notIn: [sub1, sub2] } },
        select: { id: true, status: true },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe('internal_error');
      sub3 = rows[0].id;
    },
    SLOW,
  );

  it(
    'GET /submissions/:id: của mình có sourceCode; người khác / không phải uuid → 404',
    async () => {
      const { body } = await learn('get', `/submissions/${sub1}`).expect(200);
      expect(body).toMatchObject({ id: sub1, status: 'internal_error', sourceCode: 'SUM', results: [], language: 'javascript' });
      expect((await learn('get', `/submissions/${sub1}`, dave).expect(404)).body.code).toBe('SUBMISSION_NOT_FOUND');
      await learn('get', '/submissions/abc').expect(404);
    },
    SLOW,
  );

  it(
    'chi tiết bài nộp: test công khai đủ dữ liệu, test ẩn chỉ status + timeMs',
    async () => {
      await prisma.submissionResult.createMany({
        data: [
          { submissionId: sub2, testCaseId: tests[0].id, status: 'accepted', timeMs: 5, stdoutExcerpt: '3\n', stderrExcerpt: '' },
          { submissionId: sub2, testCaseId: tests[1].id, status: 'wrong_answer', timeMs: 7, stdoutExcerpt: 'SECRET-OUT', stderrExcerpt: 'leak 2 3' },
        ],
      });
      const { body } = await learn('get', `/submissions/${sub2}`).expect(200);
      expect(body.results).toEqual([
        { testCaseId: tests[0].id, position: 0, isPublic: true, status: 'accepted', timeMs: 5, input: '1 2', expectedOutput: '3', stdout: '3\n', stderr: '' },
        { testCaseId: tests[1].id, position: 1, isPublic: false, status: 'wrong_answer', timeMs: 7 },
      ]);
      const json = JSON.stringify(body);
      expect(json).not.toContain('SECRET-OUT');
      expect(json).not.toContain('leak');
    },
    SLOW,
  );

  it(
    'GET /submissions: mới nhất trước, có status + score',
    async () => {
      const { body } = (await learn('get', '/submissions').expect(200)) as { body: Summary[] };
      expect(body.map((s) => s.id)).toEqual([sub3, sub2, sub1]);
      expect(body[0].status).toBe('internal_error');
      expect([body[1].status, body[1].score]).toEqual(['accepted', 100]);
      expect(await learn('get', '/submissions', dave).expect(200).then((r) => r.body)).toEqual([]);
    },
    SLOW,
  );

  it(
    'đã accepted → GET có lời giải, completed, bestScore',
    async () => {
      const { body } = await learn('get').expect(200);
      expect(body.solution).toEqual({ codes: { javascript: 'SUM', cpp: 'SUM' }, explanation: null });
      expect([body.completed, body.bestScore]).toEqual([true, 100]);
      // dave chưa có bài nào accepted → vẫn không thấy lời giải.
      expect((await learn('get', '', dave).expect(200)).body.solution).toBeNull();
    },
    SLOW,
  );
});
