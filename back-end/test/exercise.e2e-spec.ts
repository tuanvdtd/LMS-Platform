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
type TestCase = { id: string; position: number; input: string; expectedOutput: string; isPublic: boolean; points: number };
type Verify = {
  passed: boolean;
  problems: string[];
  languages: { language: string; compileError: string | null; tests: { status: string; stdout: string; slow: boolean }[] }[];
};

const PUBLIC_TEST = { input: '1 2', expectedOutput: '3', isPublic: true, points: 1 };
const HIDDEN_TEST = { input: '2 3', expectedOutput: '5', isPublic: false, points: 3 };
const starters = (js = 'SUM', cpp = 'SUM') => [
  { language: 'javascript', code: 'S', solutionCode: js },
  { language: 'cpp', code: 'S', solutionCode: cpp },
];
const codeBody = (over: object = {}) => ({
  languages: ['javascript', 'cpp'],
  starters: starters(),
  tests: [PUBLIC_TEST, HIDDEN_TEST],
  ...over,
});

describe('Giảng viên soạn bài code (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runner = new FakeCodeRunner();
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let bob: TestUser; // giảng viên khác
  let courseId: string;
  let sectionId: string;
  let lectureId: string;
  let exItem: string;
  let topicIds: string[];
  let ids: string[]; // id 2 test sau case PUT đầu

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
  const ex = (method: Method, path = '', body?: object) => as(method, `/items/${exItem}/exercise${path}`, body);
  const put = (body: object) => ex('put', '/code', body);
  const verify = () => ex('post', '/verify');
  const published = async () =>
    (await prisma.curriculumItem.findUniqueOrThrow({ where: { id: exItem }, select: { isPublished: true } })).isPublished;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .overrideProvider(CodeRunner)
      .useValue(runner)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, bob] = await Promise.all([makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e bài code' }).expect(201))
      .body.id as string;
    topicIds = (await prisma.topic.findMany({ take: 2, orderBy: { id: 'asc' }, select: { id: true } })).map((t) => t.id);
    await call('patch', `/api/instructor/courses/${courseId}`, alice.cookie, {
      topics: topicIds.map((id, i) => ({ id, isPrimary: i === 0 })),
    }).expect(200);
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    lectureId = await addItem('lecture', 'Bài giảng 1');
    exItem = await addItem('coding_exercise', 'Tổng hai số');
  }, SLOW);

  // course cascade → exercise/starter/test; mastery cascade theo user.
  afterAll(async () => {
    const owners = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: owners } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'GET: mặc định theo item mới tạo',
    async () => {
      const { body } = await ex('get').expect(200);
      expect(body).toMatchObject({
        title: 'Tổng hai số',
        isPublished: false,
        instructions: '',
        languages: ['javascript'],
        topicIds: [...topicIds].sort(),
        tests: [],
        starters: [],
        hints: [],
        relatedItemId: null,
      });
    },
    SLOW,
  );

  it(
    'giảng viên khác → 404; itemId không phải uuid → 404',
    async () => {
      await call('get', `/api/instructor/courses/${courseId}/items/${exItem}/exercise`, bob.cookie).expect(404);
      await as('get', '/items/abc/exercise').expect(404);
    },
    SLOW,
  );

  it(
    'PATCH: lưu đề + kiểm lecture/topic/hints',
    async () => {
      const { body } = await ex('patch', '', {
        instructions: '# Tổng hai số',
        hints: ['Dùng split'],
        difficulty: 'easy',
        relatedItemId: lectureId,
        topicIds: [topicIds[0]],
      }).expect(200);
      expect(body.exercise).toMatchObject({
        instructions: '# Tổng hai số',
        hints: ['Dùng split'],
        difficulty: 'easy',
        relatedItemId: lectureId,
        topicIds: [topicIds[0]],
      });
      await ex('patch', '', { relatedItemId: exItem }).expect(400); // không phải lecture
      const outside = await prisma.topic.findFirstOrThrow({ where: { id: { notIn: topicIds } }, select: { id: true } });
      await ex('patch', '', { topicIds: [outside.id] }).expect(400);
      await ex('patch', '', { hints: ['1', '2', '3', '4', '5', '6'] }).expect(400);
    },
    SLOW,
  );

  it(
    'PUT /code: lưu starter + test, test có id và position 0/1',
    async () => {
      const { body } = await put(codeBody()).expect(200);
      const tests = body.exercise.tests as TestCase[];
      expect(tests.map((t) => [t.position, t.input, t.isPublic, t.points])).toEqual([
        [0, '1 2', true, 1],
        [1, '2 3', false, 3],
      ]);
      expect(tests.every((t) => t.id)).toBe(true);
      expect(body.exercise).toMatchObject({ languages: ['javascript', 'cpp'] });
      expect(body.exercise).not.toHaveProperty('timeLimitMs');
      expect(body.exercise).not.toHaveProperty('memoryLimitKb');
      expect(body.exercise.starters).toEqual([
        { language: 'cpp', code: 'S', solutionCode: 'SUM' },
        { language: 'javascript', code: 'S', solutionCode: 'SUM' },
      ]);
      ids = tests.map((t) => t.id);
    },
    SLOW,
  );

  it(
    'PUT /code lại: giữ id khi đảo thứ tự, thêm / bỏ test; dữ liệu sai → 400',
    async () => {
      const [a, b] = ids;
      const swapped = await put(
        codeBody({
          tests: [
            { id: b, ...HIDDEN_TEST },
            { id: a, ...PUBLIC_TEST },
            { input: '5 5', expectedOutput: '10', isPublic: true, points: 1 },
          ],
        }),
      ).expect(200);
      const three = swapped.body.exercise.tests as TestCase[];
      expect(three.map((t) => t.position)).toEqual([0, 1, 2]);
      expect(three.slice(0, 2).map((t) => t.id)).toEqual([b, a]);
      expect(three[2].input).toBe('5 5');

      const back = await put(codeBody({ tests: [{ id: b, ...HIDDEN_TEST }, { id: a, ...PUBLIC_TEST }] })).expect(200);
      expect((back.body.exercise.tests as TestCase[]).map((t) => t.id)).toEqual([b, a]);

      await put(codeBody({ starters: [starters()[0]] })).expect(400); // thiếu starter cpp
      await put(codeBody({ tests: [{ id: randomUUID(), ...PUBLIC_TEST }] })).expect(400); // id test lạ
      await put(codeBody({ timeLimitMs: 2000 })).expect(400); // mốc cố định, không nhận từ giảng viên
      await put(codeBody({ languages: ['ruby'], starters: [{ language: 'ruby', code: 'S', solutionCode: null }] })).expect(400);
    },
    SLOW,
  );

  it(
    'verify chỉ có test ẩn → passed=false, không gọi runner',
    async () => {
      await put(codeBody({ tests: [HIDDEN_TEST] })).expect(200);
      const before = runner.calls;
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(false);
      expect(body.problems.some((p) => p.includes('test công khai'))).toBe(true);
      expect(body.languages).toEqual([]);
      expect(runner.calls).toBe(before);
    },
    SLOW,
  );

  it(
    'verify bộ đầy đủ: lời giải đạt hết → passed=true và xuất bản item',
    async () => {
      await put(codeBody()).expect(200);
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(true);
      expect(body.problems).toEqual([]);
      expect(body.languages.map((l) => l.language).sort()).toEqual(['cpp', 'javascript']);
      for (const l of body.languages) {
        expect(l.compileError).toBeNull();
        expect(l.tests.map((t) => [t.status, t.stdout, t.slow])).toEqual([
          ['accepted', '3\n', false],
          ['accepted', '5\n', false],
        ]);
      }
      expect(await published()).toBe(true);
    },
    SLOW,
  );

  it(
    'PATCH giữ nguyên xuất bản; PUT /code thì bỏ xuất bản',
    async () => {
      expect((await ex('patch', '', { difficulty: 'hard' }).expect(200)).body.exercise.isPublished).toBe(true);
      expect((await put(codeBody()).expect(200)).body.exercise.isPublished).toBe(false);
      expect(await published()).toBe(false);
    },
    SLOW,
  );

  it(
    'lời giải cpp sai → passed=false, test 2 wrong_answer, không xuất bản',
    async () => {
      await put(codeBody({ starters: starters('SUM', 'PRINT 3') })).expect(200);
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(false);
      const cpp = body.languages.find((l) => l.language === 'cpp')!;
      expect(cpp.tests.map((t) => t.status)).toEqual(['accepted', 'wrong_answer']);
      expect(cpp.tests[1].stdout).toBe('3\n');
      expect(await published()).toBe(false);
    },
    SLOW,
  );

  it(
    'lời giải cpp chạy quá 70% mốc (1500 > 1400 ms) → passed=false, test slow, không xuất bản',
    async () => {
      await put(codeBody({ starters: starters('SUM', 'SLOW 1500') })).expect(200);
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(false);
      const cpp = body.languages.find((l) => l.language === 'cpp')!;
      expect(cpp.tests.map((t) => [t.status, t.slow])).toEqual([
        ['accepted', true],
        ['accepted', true],
      ]);
      expect(body.languages.find((l) => l.language === 'javascript')!.tests.every((t) => !t.slow)).toBe(true);
      expect(body.problems).toEqual([
        'Lời giải C++ chạy quá sát giới hạn ở test 1, 2 (tối đa 1.400 ms) — giảm kích thước test hoặc tối ưu lời giải',
      ]);
      expect(await published()).toBe(false);
    },
    SLOW,
  );

  it(
    'lời giải chạy đúng 70% mốc (1400 ms) → vẫn xuất bản',
    async () => {
      await put(codeBody({ starters: starters('SUM', 'SLOW 1400') })).expect(200);
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(true);
      expect(body.problems).toEqual([]);
      expect(await published()).toBe(true);
    },
    SLOW,
  );

  it(
    'Piston sập → 503 RUNNER_UNAVAILABLE',
    async () => {
      await put(codeBody({ starters: starters('DOWN') })).expect(200);
      const res = await verify().expect(503);
      expect(res.body.code).toBe('RUNNER_UNAVAILABLE');
    },
    SLOW,
  );

  it(
    'thiếu lời giải → problems nêu tên ngôn ngữ',
    async () => {
      await put(codeBody({ starters: starters('') })).expect(200);
      const { body } = (await verify().expect(200)) as { body: Verify };
      expect(body.passed).toBe(false);
      expect(body.problems).toContain('Thiếu lời giải JavaScript');
    },
    SLOW,
  );

  it(
    'verify quá 10 lần/phút → 429 RATE_LIMITED',
    async () => {
      const redis = app.get(RedisService);
      const key = `rl:exercise-verify:${alice.id}`;
      await redis.set(key, 10, 'EX', 60);
      try {
        expect((await verify().expect(429)).body.code).toBe('RATE_LIMITED');
      } finally {
        await redis.del(key);
      }
    },
    SLOW,
  );

  it(
    'bỏ topic khỏi khoá → dọn exercise_topics, PATCH đề không còn 400 vì topic cũ',
    async () => {
      await ex('patch', '', { topicIds }).expect(200);
      await call('patch', `/api/instructor/courses/${courseId}`, alice.cookie, {
        topics: [{ id: topicIds[0], isPrimary: true }],
      }).expect(200);
      const rows = await prisma.exerciseTopic.findMany({ where: { exercise: { itemId: exItem } }, select: { topicId: true } });
      expect(rows.map((r) => r.topicId)).toEqual([topicIds[0]]);
      await ex('patch', '', { learningObjective: 'Mục tiêu mới' }).expect(200);
    },
    SLOW,
  );
});
