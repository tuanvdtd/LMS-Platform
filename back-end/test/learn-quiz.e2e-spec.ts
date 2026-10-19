import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string; type: string; isPublished: boolean }[] }[] };

describe('Học viên làm quiz (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let stu: TestUser; // học viên đã ghi danh
  let carol: TestUser; // chưa ghi danh
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let lectureId: string;
  let quizItemId: string;
  let quizId: string;
  let enrollmentId: string;
  let topicIds: string[];
  let correct: { questionId: string; optionIds: string[] }[];
  let attempt1: string;
  let attempt2: string;
  let result2: Record<string, unknown>;

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
  const learn = (method: Method, path = '', user = stu, body?: object, item = quizItemId) =>
    call(method, `/api/learn/${slug}/quizzes/${item}${path}`, user.cookie, body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, stu, carol] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e làm quiz' }).expect(201))
      .body.id as string;
    topicIds = (await prisma.topic.findMany({ take: 2, orderBy: { name: 'asc' }, select: { id: true } })).map((t) => t.id);
    await call('patch', `/api/instructor/courses/${courseId}`, alice.cookie, {
      topics: topicIds.map((id, i) => ({ id, isPrimary: i === 0 })),
    }).expect(200);
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    lectureId = await addItem('lecture', 'Bài giảng 1');
    quizItemId = await addItem('quiz', 'Quiz 1');
    const q = `/items/${quizItemId}/quiz/questions`;
    await as('post', q, {
      type: 'single_choice',
      stem: '1 + 1?',
      relatedItemId: lectureId,
      options: [
        { content: '2', isCorrect: true, explanation: 'Phép cộng' },
        { content: '3', isCorrect: false },
      ],
    }).expect(201);
    const last = await as('post', q, {
      type: 'multiple_choice',
      stem: 'Số chẵn?',
      options: [
        { content: '2', isCorrect: true },
        { content: '4', isCorrect: true },
        { content: '5', isCorrect: false },
      ],
    }).expect(201);
    correct = (last.body.quiz.questions as { id: string; options: { id: string; isCorrect: boolean }[] }[]).map((x) => ({
      questionId: x.id,
      optionIds: x.options.filter((o) => o.isCorrect).map((o) => o.id),
    }));
    // item xuất bản thứ 2 (lecture xuất bản cần asset) → đạt quiz 1 thì progressPct = 50.
    const quiz2 = await addItem('quiz', 'Quiz 2');
    await as('post', `/items/${quiz2}/quiz/questions`, {
      type: 'single_choice',
      stem: 'x?',
      options: [
        { content: 'a', isCorrect: true },
        { content: 'b', isCorrect: false },
      ],
    }).expect(201);
    const [course, quiz, enrollment] = await Promise.all([
      prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } }),
      prisma.quiz.findUniqueOrThrow({ where: { itemId: quizItemId }, select: { id: true } }),
      prisma.enrollment.create({ data: { userId: stu.id, courseId }, select: { id: true } }),
    ]);
    slug = course.slug;
    quizId = quiz.id;
    enrollmentId = enrollment.id;
  }, SLOW);

  // course cascade → quiz/attempt/enrollment; mastery cascade theo user.
  afterAll(async () => {
    const ids = [alice, stu, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'chưa ghi danh → 403 NOT_ENROLLED; item không phải quiz / không tồn tại → 404',
    async () => {
      expect((await learn('get', '', carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await learn('get', '', stu, undefined, lectureId).expect(404)).body.code).toBe('QUIZ_NOT_FOUND');
      await learn('get', '', stu, undefined, randomUUID()).expect(404);
      await learn('get', '', stu, undefined, 'abc').expect(404);
    },
    SLOW,
  );

  it(
    'overview ban đầu',
    async () => {
      const body = (await learn('get').expect(200)).body;
      expect(body).toMatchObject({
        itemId: quizItemId,
        title: 'Quiz 1',
        questionCount: 2,
        passed: false,
        bestScorePct: null,
        attempts: [],
        inProgressAttemptId: null,
      });
      expect((body.topics as { id: string }[]).map((t) => t.id).sort()).toEqual([...topicIds].sort());
    },
    SLOW,
  );

  it(
    'bắt đầu → attempt 1 không lộ đáp án; bắt đầu lại → resume cùng attempt',
    async () => {
      const res = await learn('post', '/attempts').expect(200);
      expect(res.body.attemptNo).toBe(1);
      expect(res.body.questions).toHaveLength(2);
      expect(JSON.stringify(res.body)).not.toContain('isCorrect');
      attempt1 = res.body.attemptId as string;
      const again = await learn('post', '/attempts').expect(200);
      expect(again.body.attemptId).toBe(attempt1);
      expect(again.body.questions).toEqual(res.body.questions);
      expect((await learn('get').expect(200)).body.inProgressAttemptId).toBe(attempt1);
    },
    SLOW,
  );

  it(
    'body sai → 400',
    async () => {
      await learn('post', `/attempts/${attempt1}/submit`, stu, { answers: [{ questionId: 'x', optionIds: [] }] }).expect(400);
    },
    SLOW,
  );

  it(
    'lượt 1 bỏ trắng → 0%, chưa đạt: giấu đáp án đúng + giải thích, mastery 0, chưa hoàn thành item',
    async () => {
      const res = await learn('post', `/attempts/${attempt1}/submit`, stu, { answers: [] }).expect(200);
      expect(res.body).toMatchObject({ attemptNo: 1, scorePct: 0, passed: false, correctCount: 0, answersRevealed: false });
      for (const q of res.body.questions as { isCorrect: boolean; options: { isCorrect: unknown; explanation: unknown }[] }[]) {
        expect(q.isCorrect).toBe(false);
        for (const o of q.options) expect([o.isCorrect, o.explanation]).toEqual([null, null]);
      }
      const [progress, mastery] = await Promise.all([
        prisma.itemProgress.findUnique({ where: { enrollmentId_itemId: { enrollmentId, itemId: quizItemId } } }),
        prisma.userTopicMastery.findMany({ where: { userId: stu.id, topicId: { in: topicIds } } }),
      ]);
      expect(progress).toBeNull();
      expect(mastery).toHaveLength(2);
      for (const m of mastery) expect([Number(m.score), m.attemptsCount]).toEqual([0, 1]);
    },
    SLOW,
  );

  it(
    'lượt 2 đúng hết → 100%, đạt, hiện đáp án, mastery = điểm cao nhất; ghi ItemProgress/progressPct; nộp lại → 409',
    async () => {
      const start = await learn('post', '/attempts').expect(200);
      expect(start.body.attemptNo).toBe(2);
      attempt2 = start.body.attemptId as string;
      const res = await learn('post', `/attempts/${attempt2}/submit`, stu, { answers: correct }).expect(200);
      expect(res.body).toMatchObject({ attemptNo: 2, scorePct: 100, passed: true, correctCount: 2, total: 2, answersRevealed: true });
      expect(res.body.questions.flatMap((q: { options: { isCorrect: unknown }[] }) => q.options).some((o: { isCorrect: unknown }) => o.isCorrect === true)).toBe(true);
      expect(res.body.topics.every((t: { masteryPct: number }) => t.masteryPct === 100)).toBe(true);
      result2 = res.body;

      const [answers, progress, enrollment, mastery] = await Promise.all([
        prisma.quizAnswer.count({ where: { attemptId: attempt2 } }),
        prisma.itemProgress.findUnique({ where: { enrollmentId_itemId: { enrollmentId, itemId: quizItemId } } }),
        prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } }),
        prisma.userTopicMastery.findMany({ where: { userId: stu.id, topicId: { in: topicIds } } }),
      ]);
      expect(answers).toBe(2);
      expect(progress?.completedAt).not.toBeNull();
      expect(Number(enrollment.progressPct)).toBe(50);
      for (const m of mastery) expect([Number(m.score), m.attemptsCount]).toEqual([1, 2]);

      const dup = await learn('post', `/attempts/${attempt2}/submit`, stu, { answers: correct }).expect(409);
      expect(dup.body.code).toBe('ATTEMPT_SUBMITTED');
    },
    SLOW,
  );

  it(
    'lượt 3 bỏ trắng → mastery giữ điểm cao nhất, giữ completedAt; overview vẫn đạt; đã đạt thì lượt trượt cũng hiện đáp án',
    async () => {
      const before = await prisma.itemProgress.findUniqueOrThrow({
        where: { enrollmentId_itemId: { enrollmentId, itemId: quizItemId } },
      });
      const start = await learn('post', '/attempts').expect(200);
      const res = await learn('post', `/attempts/${start.body.attemptId}/submit`, stu, { answers: [] }).expect(200);
      expect(res.body).toMatchObject({ attemptNo: 3, scorePct: 0, passed: false, answersRevealed: true });

      const [mastery, after, overview] = await Promise.all([
        prisma.userTopicMastery.findMany({ where: { userId: stu.id, topicId: { in: topicIds } } }),
        prisma.itemProgress.findUniqueOrThrow({ where: { enrollmentId_itemId: { enrollmentId, itemId: quizItemId } } }),
        learn('get').expect(200),
      ]);
      for (const m of mastery) expect([Number(m.score), m.attemptsCount]).toEqual([1, 3]);
      expect(after.completedAt).toEqual(before.completedAt);
      expect(overview.body).toMatchObject({ passed: true, bestScorePct: 100, inProgressAttemptId: null });
      expect(overview.body.attempts.map((a: { attemptNo: number }) => a.attemptNo)).toEqual([3, 2, 1]);
    },
    SLOW,
  );

  it(
    'xem kết quả: của người khác → 404; của mình → giống lúc nộp',
    async () => {
      await prisma.enrollment.create({ data: { userId: carol.id, courseId } });
      await learn('get', `/attempts/${attempt2}`, carol).expect(404);
      const res = await learn('get', `/attempts/${attempt2}`).expect(200);
      expect(res.body).toEqual(result2);
      expect(await prisma.quizAttempt.count({ where: { quizId } })).toBe(3);
    },
    SLOW,
  );
});
