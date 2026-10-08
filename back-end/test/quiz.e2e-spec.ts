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
type Option = { id: string; position: number; content: string; isCorrect: boolean; explanation: string | null };
type Question = {
  id: string;
  position: number;
  type: string;
  stem: string;
  relatedItemId: string | null;
  answerCount: number;
  options: Option[];
};
type Quiz = { description: string | null; passScorePct: number; shuffle: boolean; topicIds: string[]; questions: Question[] };
type Tree = { sections: { id: string; items: { id: string; type: string; isPublished: boolean }[] }[] };

describe('Soạn quiz (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser;
  let bob: TestUser;
  let courseId: string;
  let sectionId: string;
  let lectureId: string;
  let quizItemId: string;
  let topicIds: string[]; // 3 topic có thật trong DB; khoá gắn [0] (chính) + [1]

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
  const q = (method: Method, path = '', body?: object) => as(method, `/items/${quizItemId}/quiz${path}`, body);
  const itemOf = (tree: Tree, id: string) => tree.sections.flatMap((s) => s.items).find((i) => i.id === id)!;
  const addItem = async (type: string, title: string) => {
    const tree = (await as('post', `/sections/${sectionId}/items`, { type, title }).expect(201)).body as Tree;
    return tree.sections[0].items.at(-1)!.id;
  };
  const setCourseTopics = (ids: string[]) =>
    call('patch', `/api/instructor/courses/${courseId}`, alice.cookie, {
      topics: ids.map((id, i) => ({ id, isPrimary: i === 0 })),
    }).expect(200);
  const single = (over: object = {}) => ({
    type: 'single_choice',
    stem: 'Kết quả của `1 + 1`?',
    options: [
      { content: '2', isCorrect: true, explanation: 'Phép cộng' },
      { content: '3', isCorrect: false },
    ],
    ...over,
  });

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
    [alice, bob] = await Promise.all([makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e quiz' }).expect(201)).body
      .id as string;
    topicIds = (await prisma.topic.findMany({ take: 3, orderBy: { name: 'asc' }, select: { id: true } })).map((t) => t.id);
    await setCourseTopics(topicIds.slice(0, 2));
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    lectureId = await addItem('lecture', 'Bài giảng 1');
    quizItemId = await addItem('quiz', 'Quiz 1');
  }, SLOW);

  // course cascade → quiz/question/attempt; rồi user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'thêm item quiz → có dòng Quiz mặc định, topic = topic của khoá',
    async () => {
      const quiz = await prisma.quiz.findUnique({ where: { itemId: quizItemId }, include: { topics: true } });
      expect(quiz).toMatchObject({ courseId, description: null, passScorePct: 70, shuffle: true });
      expect(quiz!.topics.map((t) => t.topicId).sort()).toEqual(topicIds.slice(0, 2).sort());
      expect(await prisma.quiz.count({ where: { itemId: lectureId } })).toBe(0);
    },
    SLOW,
  );

  it(
    'GET quiz mặc định; PATCH lưu cài đặt; topic ngoài khoá / điểm ngoài 0–100 → 400',
    async () => {
      const quiz = (await q('get').expect(200)).body as Quiz;
      expect(quiz).toMatchObject({ description: null, passScorePct: 70, shuffle: true, questions: [] });
      expect(quiz.topicIds.sort()).toEqual(topicIds.slice(0, 2).sort());

      const res = await q('patch', '', { description: '  Ôn tập  ', passScorePct: 80, shuffle: false, topicIds: [topicIds[0]] }).expect(200);
      expect(res.body.quiz).toMatchObject({ description: 'Ôn tập', passScorePct: 80, shuffle: false, topicIds: [topicIds[0]] });
      expect(itemOf(res.body.curriculum, quizItemId).type).toBe('quiz');

      await q('patch', '', { topicIds: [topicIds[2]] }).expect(400);
      await q('patch', '', { passScorePct: 101 }).expect(400);
      await q('patch', '', { description: '' }).expect(200);
      expect((await q('get').expect(200)).body.description).toBeNull();
    },
    SLOW,
  );

  it(
    'quiz của item không phải quiz / giảng viên khác → 404; khoá in_review → ghi 409, đọc 200',
    async () => {
      await as('get', `/items/${lectureId}/quiz`).expect(404);
      await call('get', `/api/instructor/courses/${courseId}/items/${quizItemId}/quiz`, bob.cookie).expect(404);
      await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
      const res = await q('patch', '', { shuffle: true }).expect(409);
      expect(res.body.code).toBe('COURSE_LOCKED');
      await q('get').expect(200);
      await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
    },
    SLOW,
  );

  it(
    'thêm câu → lưu đủ đề + đáp án, item xuất bản',
    async () => {
      const res = await q('post', '/questions', single({ relatedItemId: lectureId })).expect(201);
      const quiz = res.body.quiz as Quiz;
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0]).toMatchObject({
        type: 'single_choice',
        stem: 'Kết quả của `1 + 1`?',
        relatedItemId: lectureId,
        answerCount: 0,
        options: [
          { position: 0, content: '2', isCorrect: true, explanation: 'Phép cộng' },
          { position: 1, content: '3', isCorrect: false, explanation: null },
        ],
      });
      expect(itemOf(res.body.curriculum, quizItemId).isPublished).toBe(true);
    },
    SLOW,
  );

  it(
    'câu hỏi sai luật → 400',
    async () => {
      const bad = [
        single({ options: [{ content: 'a', isCorrect: true }, { content: 'b', isCorrect: true }] }),
        single({ options: [{ content: 'a', isCorrect: false }, { content: 'b', isCorrect: false }] }),
        single({ type: 'multiple_choice', options: [{ content: 'a', isCorrect: false }, { content: 'b', isCorrect: false }] }),
        single({ options: [{ content: 'a', isCorrect: true }] }),
        single({ options: Array.from({ length: 16 }, (_, i) => ({ content: `${i}`, isCorrect: i === 0 })) }),
        single({ stem: '   ' }),
        single({ relatedItemId: quizItemId }),
        single({ relatedItemId: randomUUID() }),
      ];
      for (const body of bad) await q('post', '/questions', body).expect(400);
      await q('post', '/questions', single({ type: 'multiple_choice', options: [{ content: 'a', isCorrect: true }, { content: 'b', isCorrect: true }] })).expect(201);
    },
    SLOW,
  );

  it(
    'sửa câu chưa có bài làm → sửa tại chỗ; kéo thả đổi thứ tự',
    async () => {
      const before = (await q('get').expect(200)).body as Quiz;
      const [first, second] = before.questions;
      const res = await q('put', `/questions/${first.id}`, single({ stem: 'Đề mới', options: [{ content: 'x', isCorrect: false }, { content: 'y', isCorrect: true }, { content: 'z', isCorrect: false }] })).expect(200);
      const after = res.body.quiz as Quiz;
      expect(after.questions[0]).toMatchObject({ id: first.id, stem: 'Đề mới', relatedItemId: null });
      expect(after.questions[0].options.map((o) => o.content)).toEqual(['x', 'y', 'z']);
      expect(after.questions[1]).toEqual(second);

      const moved = (await q('post', `/questions/${first.id}/move`, { index: 1 }).expect(200)).body.quiz as Quiz;
      expect(moved.questions.map((x) => x.id)).toEqual([second.id, first.id]);
    },
    SLOW,
  );

  it(
    'câu đã có bài làm: sửa → archive + phiên bản mới cùng vị trí; xoá → chỉ archive',
    async () => {
      const quizRow = await prisma.quiz.findUniqueOrThrow({ where: { itemId: quizItemId }, select: { id: true } });
      const [a, b] = ((await q('get').expect(200)).body as Quiz).questions;
      await prisma.quizAttempt.create({
        data: {
          quizId: quizRow.id,
          userId: alice.id,
          attemptNo: 1,
          status: 'submitted',
          answers: {
            create: [
              { questionId: a.id, selectedOptionIds: [a.options[0].id], isCorrect: true },
              { questionId: b.id, selectedOptionIds: [b.options[0].id], isCorrect: false },
            ],
          },
        },
      });
      expect(((await q('get').expect(200)).body as Quiz).questions[0].answerCount).toBe(1);

      const res = await q('put', `/questions/${a.id}`, single({ type: a.type, stem: 'Phiên bản 2' })).expect(200);
      const now = res.body.quiz as Quiz;
      expect(now.questions[0]).toMatchObject({ stem: 'Phiên bản 2', answerCount: 0 });
      expect(now.questions[0].id).not.toBe(a.id);
      const old = await prisma.question.findUniqueOrThrow({ where: { id: a.id }, include: { options: true } });
      expect(old.archivedAt).not.toBeNull();
      expect(old.position).toBeLessThan(0);
      expect(old.options.map((o) => o.id)).toContain(a.options[0].id);

      await q('delete', `/questions/${b.id}`).expect(200);
      const archived = await prisma.question.findUniqueOrThrow({ where: { id: b.id } });
      expect(archived.archivedAt).not.toBeNull();
      expect(await prisma.quizAnswer.count({ where: { questionId: b.id } })).toBe(1);
      expect(((await q('get').expect(200)).body as Quiz).questions).toHaveLength(1);
    },
    SLOW,
  );

  it(
    'đổi loại câu hỏi khi sửa → 400, câu giữ nguyên',
    async () => {
      const before = (await q('get').expect(200)).body as Quiz;
      const [only] = before.questions;
      const other = only.type === 'single_choice' ? 'multiple_choice' : 'single_choice';
      const res = await q('put', `/questions/${only.id}`, single({ type: other })).expect(400);
      expect(JSON.stringify(res.body)).toContain('Không đổi được loại câu hỏi');
      expect((await q('get').expect(200)).body).toEqual(before);
    },
    SLOW,
  );

  it(
    'xoá câu cuối → item thôi xuất bản; câu không thuộc quiz → 404',
    async () => {
      await q('delete', `/questions/${randomUUID()}`).expect(404);
      const [last] = ((await q('get').expect(200)).body as Quiz).questions;
      const res = await q('delete', `/questions/${last.id}`).expect(200);
      expect(res.body.quiz.questions).toEqual([]);
      expect(itemOf(res.body.curriculum, quizItemId).isPublished).toBe(false);
      expect(await prisma.question.count({ where: { id: last.id } })).toBe(0); // chưa có bài làm → xoá cứng
    },
    SLOW,
  );

  // Giữ ở CUỐI describe: test này đổi topic của khoá.
  it(
    'đổi topic của khoá → QuizTopic ngoài khoá bị xoá',
    async () => {
      await setCourseTopics([topicIds[0], topicIds[2]]);
      const rows = await prisma.quizTopic.findMany({ where: { quiz: { itemId: quizItemId } } });
      expect(rows.map((r) => r.topicId)).toEqual([topicIds[0]]);
    },
    SLOW,
  );
});
