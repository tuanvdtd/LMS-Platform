import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { CodeRunner } from '../src/exercise/code-runner.js';
import { SubmissionConsumer } from '../src/exercise/submission.consumer.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeCodeRunner } from './fake-code-runner.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query
const TITLE = 'Tổng hai số';

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string; type: string; isPublished: boolean }[] }[] };

describe('SubmissionConsumer chấm bài (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let consumer: SubmissionConsumer;
  const runner = new FakeCodeRunner();
  const amqp = { publish: vi.fn().mockResolvedValue(true) };
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let stu: TestUser; // học viên đã ghi danh
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let item: string; // bài code
  let quizItem: string;
  let exerciseId: string;
  let enrollmentId: string;
  let topicIds: string[];
  let correct: { questionId: string; optionIds: string[] }[];
  let sub1: string;
  let sub2: string;
  let progressBefore: number;

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
  const learnEx = (path = '') => call('get', `/api/learn/${slug}/exercises/${item}${path}`, stu.cookie);
  const learnQuiz = (method: Method, path: string, body?: object) =>
    call(method, `/api/learn/${slug}/quizzes/${quizItem}${path}`, stu.cookie, body);

  // Mỗi user chỉ một bài pending/running (unique index một phần) → chấm xong bài này mới tạo bài sau.
  const enqueue = async (sourceCode: string) =>
    (
      await prisma.submission.create({
        data: { exerciseId, userId: stu.id, language: 'javascript', sourceCode, status: 'pending', totalTests: 2 },
        select: { id: true },
      })
    ).id;
  const grade = async (sourceCode: string, attempt = 1) => {
    const submissionId = await enqueue(sourceCode);
    await consumer.handle({ submissionId, attempt });
    return submissionId;
  };
  const row = (id: string) => prisma.submission.findUniqueOrThrow({ where: { id } });
  const results = (id: string) => prisma.submissionResult.count({ where: { submissionId: id } });
  const notifications = () => prisma.notification.findMany({ where: { userId: stu.id }, orderBy: { createdAt: 'asc' } });
  const mastery = () => prisma.userTopicMastery.findMany({ where: { userId: stu.id, topicId: { in: topicIds } } });
  const progress = () => prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
  const link = (id: string) => `/learn/${slug}/code/${item}?submission=${id}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .overrideProvider(CodeRunner)
      .useValue(runner)
      .overrideProvider(AmqpConnection)
      .useValue(amqp)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    consumer = app.get(SubmissionConsumer);
    [alice, stu] = await Promise.all([makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e chấm bài code' }).expect(201))
      .body.id as string;
    topicIds = (await prisma.topic.findMany({ take: 2, orderBy: { name: 'asc' }, select: { id: true } })).map((t) => t.id);
    // Topic của khoá phải có trước khi tạo item: quiz / bài code lấy topic mặc định lúc tạo.
    await as('patch', '', { topics: topicIds.map((id, i) => ({ id, isPrimary: i === 0 })) }).expect(200);
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    item = await addItem('coding_exercise', TITLE);
    quizItem = await addItem('quiz', 'Quiz 1');
    const q = await as('post', `/items/${quizItem}/quiz/questions`, {
      type: 'single_choice',
      stem: '1 + 1?',
      options: [
        { content: '2', isCorrect: true },
        { content: '3', isCorrect: false },
      ],
    }).expect(201);
    correct = (q.body.quiz.questions as { id: string; options: { id: string; isCorrect: boolean }[] }[]).map((x) => ({
      questionId: x.id,
      optionIds: x.options.filter((o) => o.isCorrect).map((o) => o.id),
    }));
    await as('put', `/items/${item}/exercise/code`, {
      languages: ['javascript'],
      starters: [{ language: 'javascript', code: '// starter', solutionCode: 'SUM' }],
      tests: [
        { input: '1 2', expectedOutput: '3', isPublic: true, points: 1 },
        { input: '2 3', expectedOutput: '5', isPublic: false, points: 3 },
      ],
    }).expect(200);
    expect((await as('post', `/items/${item}/exercise/verify`).expect(200)).body.passed).toBe(true);
    const [course, exercise] = await Promise.all([
      prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } }),
      prisma.exercise.findUniqueOrThrow({ where: { itemId: item }, select: { id: true } }),
    ]);
    slug = course.slug;
    exerciseId = exercise.id;
    enrollmentId = (await prisma.enrollment.create({ data: { userId: stu.id, courseId }, select: { id: true } })).id;
  }, SLOW);

  // course cascade → exercise/submission/enrollment; user cascade → notification/mastery.
  afterAll(async () => {
    const ids = [alice, stu].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'PRINT 3 → wrong_answer 25đ, 2 result, 1 notification, mastery 0.25, chưa hoàn thành item',
    async () => {
      sub1 = await grade('PRINT 3');
      const s = await row(sub1);
      expect([s.status, s.score, s.passedTests, s.totalTests]).toEqual(['wrong_answer', 25, 1, 2]);
      expect(s.gradedAt).not.toBeNull();
      expect(s.compileError).toBeNull();
      const rs = await prisma.submissionResult.findMany({
        where: { submissionId: sub1 },
        orderBy: { testCase: { position: 'asc' } },
        select: { status: true },
      });
      expect(rs.map((r) => r.status)).toEqual(['accepted', 'wrong_answer']);

      const ns = await notifications();
      expect(ns).toHaveLength(1);
      expect(ns[0]).toMatchObject({
        type: 'verdict',
        title: 'Kết quả chấm bài',
        body: `Bài "${TITLE}": Wrong Answer 1/2 test`,
        link: link(sub1),
      });
      expect(ns[0].data).toEqual({ submissionId: sub1, status: 'wrong_answer', score: 25 });

      const m = await mastery();
      expect(m).toHaveLength(2);
      for (const t of m) expect(Number(t.score)).toBeCloseTo(0.25, 3);
      const ip = await prisma.itemProgress.findUnique({ where: { enrollmentId_itemId: { enrollmentId, itemId: item } } });
      expect(ip?.completedAt ?? null).toBeNull();
    },
    SLOW,
  );

  it(
    'API chi tiết: test công khai đủ input / expectedOutput / stdout, test ẩn không lộ gì',
    async () => {
      const { body } = await learnEx(`/submissions/${sub1}`).expect(200);
      expect(body.results).toHaveLength(2);
      expect(body.results[0]).toMatchObject({ isPublic: true, input: '1 2', expectedOutput: '3', stdout: '3\n', status: 'accepted' });
      const hidden = body.results[1] as Record<string, unknown>;
      expect(hidden).toMatchObject({ isPublic: false, status: 'wrong_answer' });
      for (const k of ['input', 'expectedOutput', 'stdout', 'stderr']) expect(hidden).not.toHaveProperty(k);
    },
    SLOW,
  );

  it(
    'làm quiz đạt 100 → mastery gộp bài code: (25·5 + 100·1) / 6 / 100 = 0.375, attemptsCount 2',
    async () => {
      const start = await learnQuiz('post', '/attempts').expect(200);
      await learnQuiz('post', `/attempts/${start.body.attemptId}/submit`, { answers: correct }).expect(200);
      const m = await mastery();
      expect(m).toHaveLength(2);
      for (const t of m) expect([Number(t.score).toFixed(3), t.attemptsCount]).toEqual(['0.375', 2]);
      progressBefore = Number((await progress()).progressPct);
      expect(progressBefore).toBeGreaterThan(0);
    },
    SLOW,
  );

  it(
    'SUM → accepted 100đ, hoàn thành item, progressPct tăng, mastery = 1, lời giải được mở',
    async () => {
      sub2 = await grade('SUM');
      const s = await row(sub2);
      expect([s.status, s.score, s.passedTests]).toEqual(['accepted', 100, 2]);
      const ip = await prisma.itemProgress.findUniqueOrThrow({ where: { enrollmentId_itemId: { enrollmentId, itemId: item } } });
      expect(ip.completedAt).not.toBeNull();
      expect(Number((await progress()).progressPct)).toBeGreaterThan(progressBefore);
      for (const t of await mastery()) expect(Number(t.score)).toBeCloseTo(1, 3);
      const { body } = await learnEx().expect(200);
      expect(body.solution).not.toBeNull();
      expect([body.completed, body.bestScore]).toEqual([true, 100]);
    },
    SLOW,
  );

  it(
    'giao lại job đã chấm → bỏ qua: không chạy lại, không nhân đôi result / notification',
    async () => {
      const [calls, ns] = [runner.calls, (await notifications()).length];
      await consumer.handle({ submissionId: sub2, attempt: 1 });
      expect(runner.calls).toBe(calls);
      expect(await results(sub2)).toBe(2);
      expect(await notifications()).toHaveLength(ns);
    },
    SLOW,
  );

  it(
    'COMPILE_ERROR → compile_error, 0 result, notification "Lỗi biên dịch", bestScore vẫn 100',
    async () => {
      const id = await grade('COMPILE_ERROR');
      const s = await row(id);
      expect([s.status, s.score, s.passedTests, s.compileError]).toEqual(['compile_error', 0, 0, 'main.cpp:1: error']);
      expect(await results(id)).toBe(0);
      const last = (await notifications()).at(-1)!;
      expect(last).toMatchObject({ body: `Bài "${TITLE}": Lỗi biên dịch`, link: link(id) });
      expect(last.data).toEqual({ submissionId: id, status: 'compile_error', score: 0 });
      expect((await learnEx().expect(200)).body.bestScore).toBe(100);
    },
    SLOW,
  );

  it(
    'Piston sập: lần 1 → submission.retry (attempt 2), vẫn running; lần 3 → submission.dead + internal_error + notification',
    async () => {
      amqp.publish.mockClear();
      const id = await enqueue('DOWN');
      await consumer.handle({ submissionId: id, attempt: 1 });
      expect(amqp.publish).toHaveBeenCalledTimes(1);
      expect(amqp.publish).toHaveBeenCalledWith(
        '',
        'submission.retry',
        { submissionId: id, attempt: 2 },
        expect.objectContaining({ persistent: true }),
      );
      expect((await row(id)).status).toBe('running');

      const before = (await notifications()).length;
      await consumer.handle({ submissionId: id, attempt: 3 });
      expect(amqp.publish).toHaveBeenLastCalledWith(
        '',
        'submission.dead',
        expect.objectContaining({ submissionId: id, attempt: 3 }),
        expect.objectContaining({ persistent: true }),
      );
      const s = await row(id);
      expect(s.status).toBe('internal_error');
      expect(s.gradedAt).not.toBeNull();
      const ns = await notifications();
      expect(ns).toHaveLength(before + 1);
      expect(ns.at(-1)).toMatchObject({ body: `Bài "${TITLE}": Lỗi hệ thống, hãy nộp lại`, link: link(id) });
    },
    SLOW,
  );

  it(
    'job sai định dạng → submission.dead reason invalid, không ném lỗi',
    async () => {
      amqp.publish.mockClear();
      await expect(consumer.handle({ foo: 1 })).resolves.toBeUndefined();
      expect(amqp.publish).toHaveBeenCalledWith('', 'submission.dead', { raw: { foo: 1 }, reason: 'invalid' }, expect.anything());
      await expect(consumer.handle({ submissionId: 'abc', attempt: 1 })).resolves.toBeUndefined();
      expect(amqp.publish).toHaveBeenCalledTimes(2);
    },
    SLOW,
  );

  it(
    'bài đã bị đánh dấu kẹt (internal_error) → bỏ qua, không result / notification',
    async () => {
      const id = await enqueue('SUM');
      await prisma.submission.update({ where: { id }, data: { status: 'internal_error', gradedAt: new Date() } });
      const [calls, ns] = [runner.calls, (await notifications()).length];
      await consumer.handle({ submissionId: id, attempt: 1 });
      expect(runner.calls).toBe(calls);
      expect(await results(id)).toBe(0);
      expect(await notifications()).toHaveLength(ns);
      expect((await row(id)).status).toBe('internal_error');
    },
    SLOW,
  );

  it(
    'bị đánh dấu kẹt giữa lúc đọc và chuyển running (học viên đã có bài pending mới) → bỏ qua, không hồi sinh, không retry',
    async () => {
      const id = await enqueue('SUM');
      const real = consumer.find.bind(consumer);
      let fresh = '';
      const spy = vi.spyOn(consumer, 'find').mockImplementationOnce(((sid: string) =>
        real(sid).then(async (s) => {
          await prisma.submission.update({ where: { id }, data: { status: 'internal_error', gradedAt: new Date() } });
          fresh = await enqueue('SUM');
          return s;
        })) as never);
      amqp.publish.mockClear();
      const [calls, ns] = [runner.calls, (await notifications()).length];
      try {
        await consumer.handle({ submissionId: id, attempt: 1 });
      } finally {
        spy.mockRestore();
      }
      expect(amqp.publish).not.toHaveBeenCalled(); // update trần sẽ ném P2002 → retry
      expect(runner.calls).toBe(calls);
      expect((await row(id)).status).toBe('internal_error');
      expect((await row(fresh)).status).toBe('pending');
      expect(await results(id)).toBe(0);
      expect(await notifications()).toHaveLength(ns);
      await prisma.submission.update({ where: { id: fresh }, data: { status: 'internal_error', gradedAt: new Date() } });
    },
    SLOW,
  );

  it(
    'hết lượt nhưng bài vừa bị đánh dấu kẹt → vẫn đẩy submission.dead, không ghi đè / không notification thứ hai',
    async () => {
      const id = await enqueue('DOWN');
      const real = consumer.find.bind(consumer);
      let n = 0;
      const spy = vi.spyOn(consumer, 'find').mockImplementation(((sid: string) =>
        real(sid).then(async (s) => {
          if (++n === 2) await prisma.submission.update({ where: { id }, data: { status: 'internal_error', gradedAt: new Date() } });
          return s;
        })) as never);
      amqp.publish.mockClear();
      const ns = (await notifications()).length;
      try {
        await consumer.handle({ submissionId: id, attempt: 3 });
      } finally {
        spy.mockRestore();
      }
      expect(amqp.publish).toHaveBeenCalledWith('', 'submission.dead', expect.objectContaining({ submissionId: id }), expect.anything());
      expect((await row(id)).status).toBe('internal_error');
      expect(await notifications()).toHaveLength(ns);
    },
    SLOW,
  );

  it(
    'bị đánh dấu kẹt ngay giữa lúc chấm → transaction bỏ qua, không ghi đè',
    async () => {
      const id = await enqueue('SUM');
      const real = runner.run.bind(runner);
      const spy = vi.spyOn(runner, 'run').mockImplementationOnce(async (...args) => {
        await prisma.submission.update({ where: { id }, data: { status: 'internal_error', gradedAt: new Date() } });
        return real(...args);
      });
      const ns = (await notifications()).length;
      try {
        await consumer.handle({ submissionId: id, attempt: 1 });
      } finally {
        spy.mockRestore();
      }
      expect((await row(id)).status).toBe('internal_error');
      expect(await results(id)).toBe(0);
      expect(await notifications()).toHaveLength(ns);
    },
    SLOW,
  );

  it(
    'giảng viên sửa đề lúc bài còn trong hàng đợi (item chưa xuất bản) → internal_error + notification, không chấm',
    async () => {
      await prisma.curriculumItem.update({ where: { id: item }, data: { isPublished: false } });
      const calls = runner.calls;
      const ns = (await notifications()).length;
      try {
        const id = await grade('SUM');
        expect((await row(id)).status).toBe('internal_error');
        expect(await results(id)).toBe(0);
        expect(runner.calls).toBe(calls);
        const all = await notifications();
        expect(all).toHaveLength(ns + 1);
        expect(all.at(-1)?.body).toBe(`Bài "${TITLE}": Bài tập đang được cập nhật, hãy nộp lại`);
      } finally {
        await prisma.curriculumItem.update({ where: { id: item }, data: { isPublished: true } });
      }
    },
    SLOW,
  );
});
