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
const SLOW = 120_000; // DB dev ~1-2s/query
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const A = '/api/instructor/analytics';

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post';

describe('Dashboard phân tích giảng viên (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendCourseNudge: vi.fn() };
  let alice: TestUser; // giảng viên chủ khoá
  let bob: TestUser; // giảng viên khác
  let s1: TestUser; // đạt quiz ngay lượt đầu, đạt bài code ở lần 2, đã hoàn thành khoá
  let s2: TestUser; // trượt quiz lượt 1, đạt lượt 2
  let s3: TestUser; // ghi danh 40 ngày, chưa vào học
  let courseId: string;
  let quizId: string;
  let exerciseId: string;
  let topicId: string;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (name: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name, email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, bob, s1, s2, s3] = await Promise.all([
      makeUser('Alice Nguyễn'), makeUser('Bob'), makeUser('Trần Minh An'), makeUser('Lê Thu Hà'), makeUser('Phạm Quốc Bảo'),
    ]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e phân tích' }).expect(201)).body.id as string;
    topicId = (await prisma.topic.findFirstOrThrow({ where: { slug: 'javascript' }, select: { id: true } })).id;
    await prisma.courseTopic.create({ data: { courseId, topicId, isPrimary: true } });
    const section = await prisma.section.create({ data: { courseId, title: 'Phần 1', position: 0 } });

    const quizItem = await prisma.curriculumItem.create({
      data: { sectionId: section.id, courseId, type: 'quiz', title: 'Quiz e2e', position: 0, isPublished: true },
    });
    quizId = (await prisma.quiz.create({ data: { itemId: quizItem.id, courseId, passScorePct: 70 } })).id;
    const q = await prisma.question.create({
      data: {
        quizId, position: 0, type: 'single_choice', stem: 'Câu 1',
        options: { create: [{ content: 'Đúng', isCorrect: true, position: 0 }, { content: 'Sai', isCorrect: false, position: 1 }] },
      },
      include: { options: { orderBy: { position: 'asc' } } },
    });
    const [right, wrong] = q.options;
    const attempt = (userId: string, attemptNo: number, ok: boolean, at: Date) =>
      prisma.quizAttempt.create({
        data: {
          quizId, userId, attemptNo, status: 'submitted', startedAt: at, submittedAt: at, scorePct: ok ? 100 : 0, passed: ok,
          timeSpentSec: 60, questionIds: [q.id], passScorePct: 70, shuffle: false,
          answers: { create: { questionId: q.id, selectedOptionIds: [ok ? right.id : wrong.id], isCorrect: ok, pointsAwarded: ok ? 1 : 0, answeredAt: at } },
        },
      });
    await attempt(s1.id, 1, true, daysAgo(10));
    await attempt(s2.id, 1, false, daysAgo(9));
    await attempt(s2.id, 2, true, daysAgo(8));

    const exItem = await prisma.curriculumItem.create({
      data: { sectionId: section.id, courseId, type: 'coding_exercise', title: 'Bài code e2e', position: 1, isPublished: true },
    });
    const ex = await prisma.exercise.create({
      data: {
        itemId: exItem.id, courseId, instructions: 'Đề', languages: ['javascript'],
        testCases: { create: [{ position: 0, input: '1', expectedOutput: '1', isPublic: true }, { position: 1, input: '2', expectedOutput: '2', isPublic: false }] },
      },
      include: { testCases: { orderBy: { position: 'asc' } } },
    });
    exerciseId = ex.id;
    const submit = (userId: string, ok: boolean, at: Date) =>
      prisma.submission.create({
        data: {
          exerciseId, userId, language: 'javascript', sourceCode: 'x', status: ok ? 'accepted' : 'wrong_answer',
          score: ok ? 100 : 50, passedTests: ok ? 2 : 1, totalTests: 2, submittedAt: at, gradedAt: at,
          results: { create: ex.testCases.map((t) => ({ testCaseId: t.id, status: ok || t.position === 0 ? 'accepted' : 'wrong_answer', receivedAt: at })) },
        },
      });
    await submit(s1.id, false, daysAgo(7));
    await submit(s1.id, true, daysAgo(6));

    await prisma.enrollment.createMany({
      data: [
        { userId: s1.id, courseId, createdAt: daysAgo(30), lastAccessedAt: daysAgo(1), progressPct: 100, completedAt: daysAgo(6) },
        { userId: s2.id, courseId, createdAt: daysAgo(30), lastAccessedAt: daysAgo(2), progressPct: 50 },
        { userId: s3.id, courseId, createdAt: daysAgo(40), lastAccessedAt: null, progressPct: 0 },
      ],
    });
    await prisma.userTopicSkill.create({ data: { userId: s1.id, topicId, rating: 1300, answerCount: 12, lastStartedAt: daysAgo(3) } });
  }, SLOW);

  // course cascade → quiz/attempt/exercise/submission/enrollment/nudge; user cascade → thông báo, điểm kỹ năng.
  afterAll(async () => {
    if (courseId) await prisma?.course.deleteMany({ where: { id: courseId } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it('[assess] danh sách khoá chỉ có khoá của mình, số học viên đếm từ enrollments', async () => {
    const mine = (await call('get', `${A}/courses`, alice.cookie).expect(200)).body as { id: string; enrolled: number }[];
    expect(mine).toContainEqual(expect.objectContaining({ id: courseId, enrolled: 3 }));
    const others = (await call('get', `${A}/courses`, bob.cookie).expect(200)).body as { id: string }[];
    expect(others.some((c) => c.id === courseId)).toBe(false);
  }, SLOW);

  it('[assess] tổng quan quiz + bài code của khoá', async () => {
    const body = (await call('get', `${A}/courses/${courseId}/assessments`, alice.cookie).expect(200)).body;
    expect(body.minSample).toBe(30);
    expect(body.quizzes).toEqual([
      expect.objectContaining({
        quizId, title: 'Quiz e2e', sectionTitle: 'Phần 1', questionCount: 1, learners: 2,
        firstAttempt: { n: 2, meanPct: 50, medianPct: 50, passRatePct: 50 },
        finalPassRatePct: 100, avgAttemptsToPass: 1.5, flagged: { fix: 0, review: 0 },
      }),
    ]);
    expect(body.exercises).toEqual([expect.objectContaining({ exerciseId, learners: 1, passRatePct: 100, avgSubmissionsToPass: 2, stuck: 0 })]);
  }, SLOW);

  it('[assess] chi tiết quiz: mỗi câu có n, p, phân bố; dưới 30 lượt thì Chưa đủ dữ liệu', async () => {
    const body = (await call('get', `${A}/quizzes/${quizId}`, alice.cookie).expect(200)).body;
    expect(body.quiz).toMatchObject({ id: quizId, courseId, passScorePct: 70, title: 'Quiz e2e' });
    const [q] = body.questions;
    expect(q).toMatchObject({ n: 2, p: 0.5, status: 'insufficient', flags: [] });
    expect(q.options.map((o: { pickedCount: number }) => o.pickedCount)).toEqual([1, 1]);
  }, SLOW);

  it('[assess] chi tiết bài code: tỉ lệ rớt từng test', async () => {
    const body = (await call('get', `${A}/exercises/${exerciseId}`, alice.cookie).expect(200)).body;
    expect(body.summary).toMatchObject({ learners: 1, passed: 1, submissions: 2 });
    expect(body.tests.map((t: { failRatePct: number }) => t.failRatePct)).toEqual([0, 50]);
  }, SLOW);

  it('[skills] dưới 5 học viên đã đo → không trả điểm, không trả gain', async () => {
    const body = (await call('get', `${A}/courses/${courseId}/skills`, alice.cookie).expect(200)).body;
    expect(body).toMatchObject({ enrolled: 3, minGroup: 5 });
    expect(body.topics).toEqual([expect.objectContaining({ topicId, isPrimary: true, measured: 1, masteryPcts: null, gain: null })]);
  }, SLOW);

  it('[students] mức nguy cơ + lý do; nguy cơ cao lên đầu', async () => {
    const body = (await call('get', `${A}/courses/${courseId}/students`, alice.cookie).expect(200)).body;
    expect(body.summary).toMatchObject({ enrolled: 3, completed: 1, high: 1, watch: 1 });
    expect(body.students[0]).toMatchObject({ userId: s3.id, risk: { level: 'high', inactiveDays: 40 } });
    expect(typeof body.students[0].canMessage).toBe('boolean');
    expect(body.students.find((s: { userId: string }) => s.userId === s1.id)).toMatchObject({
      quiz: { attempted: 1, avgFirstPct: 100 }, code: { passed: 1, total: 1 }, risk: { level: 'done' },
    });
  }, SLOW);

  it('[students] lọc theo mức + phân trang; số đếm từng mức tính trên cả lớp', async () => {
    const high = (await call('get', `${A}/courses/${courseId}/students?level=high`, alice.cookie).expect(200)).body;
    expect(high).toMatchObject({ total: 1, page: 1, pageSize: 20, counts: { all: 3, high: 1, watch: 1, ok: 0, new: 0, done: 1 } });
    expect(high.students.map((s: { userId: string }) => s.userId)).toEqual([s3.id]);
    // Trang vượt quá → về trang cuối (không trả danh sách rỗng khi đổi bộ lọc).
    const beyond = (await call('get', `${A}/courses/${courseId}/students?page=9`, alice.cookie).expect(200)).body;
    expect(beyond).toMatchObject({ page: 1, total: 3 });
    expect(beyond.students).toHaveLength(3);
    await call('get', `${A}/courses/${courseId}/students?level=abc`, alice.cookie).expect(400);
    await call('get', `${A}/courses/${courseId}/students?page=0`, alice.cookie).expect(400);
  }, SLOW);

  it('[students] chi tiết: dòng thời gian trong khoá; người ngoài khoá → 404', async () => {
    const body = (await call('get', `${A}/courses/${courseId}/students/${s2.id}`, alice.cookie).expect(200)).body;
    expect(body.timeline.map((e: { kind: string }) => e.kind)).toEqual(['quiz', 'quiz', 'enrolled']);
    await call('get', `${A}/courses/${courseId}/students/${bob.id}`, alice.cookie).expect(404);
  }, SLOW);

  it('[nudge] gửi thông báo + email, thay {ten}; bỏ qua người đã xong / ngoài khoá / vừa nhắc', async () => {
    const send = (userIds: string[]) =>
      call('post', `${A}/courses/${courseId}/nudges`, alice.cookie, { userIds, kind: 'reminder', message: 'Chào {ten}, quay lại học nhé' });
    expect((await send([s3.id, s1.id, bob.id]).expect(200)).body).toEqual({
      sent: [s3.id],
      skipped: [{ userId: s1.id, reason: 'completed' }, { userId: bob.id, reason: 'not_enrolled' }],
    });
    const n = await prisma.notification.findFirstOrThrow({ where: { userId: s3.id, type: 'course_nudge' } });
    expect(n.body).toBe('Chào Bảo, quay lại học nhé');
    expect(n.link).toMatch(/^\/learn\//);
    expect(mail.sendCourseNudge).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ kind: 'reminder', message: 'Chào Bảo, quay lại học nhé' }));
    expect((await send([s3.id]).expect(200)).body).toEqual({ sent: [], skipped: [{ userId: s3.id, reason: 'recent' }] });
    const row = (await call('get', `${A}/courses/${courseId}/students`, alice.cookie).expect(200)).body.students.find(
      (s: { userId: string }) => s.userId === s3.id,
    );
    expect(row.lastNudge).toMatchObject({ kind: 'reminder', returned: false });
  }, SLOW);

  it('[nudge] body sai → 400', async () => {
    const post = (body: object) => call('post', `${A}/courses/${courseId}/nudges`, alice.cookie, body);
    await post({ userIds: [], kind: 'reminder', message: 'x' }).expect(400);
    await post({ userIds: [s3.id, s3.id], kind: 'reminder', message: 'x' }).expect(400);
    await post({ userIds: [s3.id], kind: 'spam', message: 'x' }).expect(400);
    await post({ userIds: [s3.id], kind: 'reminder', message: 'x'.repeat(501) }).expect(400);
  }, SLOW);

  it('[owner] giảng viên khác hoặc id sai → 404 ở mọi API có id', async () => {
    const paths = [
      `courses/${courseId}/assessments`, `quizzes/${quizId}`, `exercises/${exerciseId}`, `courses/${courseId}/skills`,
      `courses/${courseId}/students`, `courses/${courseId}/students/${s2.id}`, 'courses/khong-phai-uuid/students', 'quizzes/khong-phai-uuid',
    ];
    for (const p of paths) await call('get', `${A}/${p}`, bob.cookie).expect(404);
    await call('post', `${A}/courses/${courseId}/nudges`, bob.cookie, { userIds: [s2.id], kind: 'reminder', message: 'x' }).expect(404);
  }, SLOW);

  it('[owner-excluded] ghi danh của chính chủ khoá không tính vào học viên / kỹ năng / danh sách khoá', async () => {
    const enrolledOf = async () => ((await call('get', `${A}/courses`, alice.cookie).expect(200)).body as { id: string; enrolled: number }[]).find((c) => c.id === courseId)!.enrolled;
    const studentsOf = async () => (await call('get', `${A}/courses/${courseId}/students?level=all&page=1`, alice.cookie).expect(200)).body;
    const [enrolled0, students0, skills0] = await Promise.all([
      enrolledOf(),
      studentsOf(),
      call('get', `${A}/courses/${courseId}/skills`, alice.cookie).expect(200).then((r) => r.body),
    ]);
    const own = await prisma.enrollment.create({ data: { userId: alice.id, courseId } });
    try {
      expect(await enrolledOf()).toBe(enrolled0);
      const students1 = await studentsOf();
      expect(students1.students.some((x: { userId: string }) => x.userId === alice.id)).toBe(false);
      expect(students1.counts.all).toBe(students0.counts.all);
      expect((await call('get', `${A}/courses/${courseId}/skills`, alice.cookie).expect(200)).body.enrolled).toBe(skills0.enrolled);
    } finally {
      await prisma.enrollment.delete({ where: { id: own.id } });
    }
  }, SLOW);
});
