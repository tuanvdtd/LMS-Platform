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
type Answer = { questionId: string; optionIds: string[] };

// Quiz riêng (không dùng chung với learn-quiz.e2e-spec) vì các test ở đây đổi cấu hình giờ/lượt.
describe('Quiz: giới hạn thời gian, số lượt, lưu đáp án (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên chủ khoá
  let stu: TestUser; // học viên đã ghi danh
  let carol: TestUser; // chưa ghi danh
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let quizItemId: string;
  let quizId: string;
  let correct: Answer[];

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
  const learn = (method: Method, path = '', user = stu, body?: object) =>
    call(method, `/api/learn/${slug}/quizzes/${quizItemId}${path}`, user.cookie, body);
  const setQuiz = (body: object) => as('patch', `/items/${quizItemId}/quiz`, body);
  // Giả lập thời gian trôi: lùi startedAt của lượt.
  const shiftStart = (attemptId: string, minutes: number) =>
    prisma.quizAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() - minutes * 60_000) } });
  const resetAttempts = () => prisma.quizAttempt.deleteMany({ where: { quizId } });

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
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e giới hạn quiz' }).expect(201))
      .body.id as string;
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    quizItemId = await addItem('quiz', 'Quiz giới hạn');
    const q = `/items/${quizItemId}/quiz/questions`;
    await as('post', q, {
      type: 'single_choice',
      stem: '1 + 1?',
      options: [
        { content: '2', isCorrect: true },
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
    // Item xuất bản thứ 2 → đạt quiz này không làm khoá hoàn thành (không cấp chứng chỉ trong test).
    const quiz2 = await addItem('quiz', 'Quiz 2');
    await as('post', `/items/${quiz2}/quiz/questions`, {
      type: 'single_choice',
      stem: 'x?',
      options: [
        { content: 'a', isCorrect: true },
        { content: 'b', isCorrect: false },
      ],
    }).expect(201);
    const [course, quiz] = await Promise.all([
      prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } }),
      prisma.quiz.findUniqueOrThrow({ where: { itemId: quizItemId }, select: { id: true } }),
      prisma.enrollment.create({ data: { userId: stu.id, courseId } }),
    ]);
    slug = course.slug;
    quizId = quiz.id;
  }, SLOW);

  // course cascade → quiz/attempt/enrollment.
  afterAll(async () => {
    const ids = [alice, stu, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'GV: PATCH nhận timeLimitMin/maxAttempts trong giới hạn hoặc null',
    async () => {
      await setQuiz({ timeLimitMin: 0 }).expect(400);
      await setQuiz({ timeLimitMin: 181 }).expect(400);
      await setQuiz({ maxAttempts: 11 }).expect(400);
      const ok = await setQuiz({ timeLimitMin: 15, maxAttempts: 3 }).expect(200);
      expect(ok.body.quiz).toMatchObject({ timeLimitMin: 15, maxAttempts: 3 });
      const off = await setQuiz({ timeLimitMin: null, maxAttempts: null }).expect(200);
      expect(off.body.quiz).toMatchObject({ timeLimitMin: null, maxAttempts: null });
    },
    SLOW,
  );

  it(
    'lưu câu → làm tiếp thấy savedAnswers; optionIds rỗng xoá; câu ngoài đề 400; chưa ghi danh 403; lượt của người khác 404',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: null, maxAttempts: null }).expect(200);
      const s = (await learn('post', '/attempts').expect(200)).body;
      expect(s.remainingSec).toBeNull();
      expect(s.savedAnswers).toEqual([]);
      const save = (answers: Answer[], user = stu) => learn('put', `/attempts/${s.attemptId}/answers`, user, { answers });
      expect((await save([correct[0]]).expect(200)).body).toEqual({ remainingSec: null });
      const resumed = (await learn('post', '/attempts').expect(200)).body;
      expect(resumed.attemptId).toBe(s.attemptId);
      expect(resumed.savedAnswers).toEqual([correct[0]]);
      const row = await prisma.quizAnswer.findFirstOrThrow({ where: { attemptId: s.attemptId } });
      expect(row.isCorrect).toBeNull();
      await save([{ questionId: correct[0].questionId, optionIds: [] }]).expect(200);
      expect(await prisma.quizAnswer.count({ where: { attemptId: s.attemptId } })).toBe(0);
      expect((await save([{ questionId: randomUUID(), optionIds: [] }]).expect(400)).body.code).toBe('QUESTION_NOT_IN_ATTEMPT');
      await save([correct[0]], carol).expect(403); // chưa ghi danh → NOT_ENROLLED trước
      const e = await prisma.enrollment.create({ data: { userId: carol.id, courseId }, select: { id: true } });
      await save([correct[0]], carol).expect(404); // đã ghi danh nhưng lượt là của stu
      await prisma.enrollment.delete({ where: { id: e.id } });
    },
    SLOW,
  );

  it(
    'nộp: chấm từ DB, ghép câu đã lưu + câu gửi kèm, đủ 1 dòng/câu',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: null, maxAttempts: null }).expect(200);
      const s = (await learn('post', '/attempts').expect(200)).body;
      await learn('put', `/attempts/${s.attemptId}/answers`, stu, { answers: [correct[0]] }).expect(200);
      const r = (await learn('post', `/attempts/${s.attemptId}/submit`, stu, { answers: [correct[1]] }).expect(200)).body;
      expect(r).toMatchObject({ scorePct: 100, passed: true, timedOut: false });
      const rows = await prisma.quizAnswer.findMany({ where: { attemptId: s.attemptId } });
      expect(rows).toHaveLength(2);
      expect(rows.every((x) => x.isCorrect === true)).toBe(true);
      const late = await learn('put', `/attempts/${s.attemptId}/answers`, stu, { answers: [correct[0]] }).expect(409);
      expect(late.body.code).toBe('ATTEMPT_SUBMITTED');
    },
    SLOW,
  );

  it(
    'hết giờ: lưu 409 ATTEMPT_EXPIRED, chấm phần đã lưu, kết quả timedOut',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: 1, maxAttempts: null }).expect(200);
      const s = (await learn('post', '/attempts').expect(200)).body;
      expect(s.remainingSec).toBeGreaterThan(30); // DB dev chậm 1-2s/query
      await learn('put', `/attempts/${s.attemptId}/answers`, stu, { answers: [correct[0]] }).expect(200);
      await shiftStart(s.attemptId, 2); // hạn đã qua 1 phút > khoảng dư 30 giây
      const res = await learn('put', `/attempts/${s.attemptId}/answers`, stu, { answers: [correct[1]] }).expect(409);
      expect(res.body.code).toBe('ATTEMPT_EXPIRED');
      const r = (await learn('get', `/attempts/${s.attemptId}`).expect(200)).body;
      expect(r).toMatchObject({ timedOut: true, scorePct: 50, correctCount: 1 });
      const a = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: s.attemptId } });
      expect(a.timeSpentSec).toBe(60);
    },
    SLOW,
  );

  it(
    'hết giờ khi đã rời trang: overview tự đóng lượt',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: 1, maxAttempts: null }).expect(200);
      const s = (await learn('post', '/attempts').expect(200)).body;
      await learn('put', `/attempts/${s.attemptId}/answers`, stu, { answers: [correct[0]] }).expect(200);
      await shiftStart(s.attemptId, 5);
      const o = (await learn('get').expect(200)).body;
      expect(o.inProgressAttemptId).toBeNull();
      expect(o.attempts[0]).toMatchObject({ id: s.attemptId, scorePct: 50 });
    },
    SLOW,
  );

  it(
    'nộp trong khoảng dư nhận câu gửi kèm; quá khoảng dư thì bỏ',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: 1, maxAttempts: null }).expect(200);
      const a1 = (await learn('post', '/attempts').expect(200)).body;
      // Hạn đã qua 10 giây, vẫn trong khoảng dư 30 giây.
      await prisma.quizAttempt.update({ where: { id: a1.attemptId }, data: { startedAt: new Date(Date.now() - 70_000) } });
      const inGrace = (await learn('post', '/attempts').expect(200)).body;
      expect(inGrace).toMatchObject({ attemptId: a1.attemptId, remainingSec: 0 });
      const r1 = (await learn('post', `/attempts/${a1.attemptId}/submit`, stu, { answers: correct }).expect(200)).body;
      expect(r1).toMatchObject({ scorePct: 100, timedOut: true });

      const a2 = (await learn('post', '/attempts').expect(200)).body;
      await shiftStart(a2.attemptId, 2);
      const r2 = (await learn('post', `/attempts/${a2.attemptId}/submit`, stu, { answers: correct }).expect(200)).body;
      expect(r2).toMatchObject({ scorePct: 0, timedOut: true });
    },
    SLOW,
  );

  it(
    'đổi thời gian giữa chừng không ảnh hưởng lượt đang làm',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: 1, maxAttempts: null }).expect(200);
      const s = (await learn('post', '/attempts').expect(200)).body;
      await setQuiz({ timeLimitMin: 60 }).expect(200);
      const resumed = (await learn('post', '/attempts').expect(200)).body;
      expect(resumed.attemptId).toBe(s.attemptId);
      expect(resumed.remainingSec).toBeLessThanOrEqual(60);
    },
    SLOW,
  );

  it(
    'số lượt: đủ N → ATTEMPT_LIMIT; lượt dở không bị chặn; quá 24 giờ làm tiếp được; chủ khoá không bị chặn',
    async () => {
      await resetAttempts();
      await setQuiz({ timeLimitMin: null, maxAttempts: 2 }).expect(200);
      const a1 = (await learn('post', '/attempts').expect(200)).body;
      await learn('post', `/attempts/${a1.attemptId}/submit`, stu, { answers: [] }).expect(200);
      const a2 = (await learn('post', '/attempts').expect(200)).body;
      expect((await learn('post', '/attempts').expect(200)).body.attemptId).toBe(a2.attemptId); // làm tiếp lượt dở
      expect((await learn('get').expect(200)).body).toMatchObject({ attemptsLeft: 0, maxAttempts: 2 });
      await learn('post', `/attempts/${a2.attemptId}/submit`, stu, { answers: [] }).expect(200);
      const blocked = await learn('post', '/attempts').expect(409);
      expect(blocked.body.code).toBe('ATTEMPT_LIMIT');
      expect(new Date(blocked.body.nextAttemptAt as string).getTime()).toBeGreaterThan(Date.now());
      expect((await learn('get', `/attempts/${a2.attemptId}`).expect(200)).body.attemptsLeft).toBe(0);
      await shiftStart(a1.attemptId, 24 * 60 + 1);
      await learn('post', '/attempts').expect(200);
      // Chủ khoá làm thử: không bị giới hạn.
      for (let i = 0; i < 3; i++) {
        const s = (await learn('post', '/attempts', alice).expect(200)).body;
        await learn('post', `/attempts/${s.attemptId}/submit`, alice, { answers: [] }).expect(200);
      }
      expect((await learn('get', '', alice).expect(200)).body.attemptsLeft).toBeNull();
    },
    SLOW,
  );
});
