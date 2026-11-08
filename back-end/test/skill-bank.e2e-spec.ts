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
type Method = 'get' | 'post' | 'patch';
type Diff = 'easy' | 'medium' | 'hard';

const body = (stem: string, difficulty: Diff = 'easy', type = 'single_choice') => ({
  type,
  stem,
  difficulty,
  options: [
    { content: 'Đáp án A', isCorrect: true, explanation: 'Vì A' },
    { content: 'Đáp án B', isCorrect: false },
    { content: 'Đáp án C', isCorrect: false },
  ],
});

describe('Ngân hàng câu kỹ năng (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let topic: { id: string; slug: string };
  let admin: TestUser;
  let mod: TestUser;
  let student: TestUser;
  let q1: any; // câu easy do moderator tạo
  let q2: any; // câu easy do admin tạo

  const call = (method: Method, path: string, user?: TestUser, payload?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = user ? r.set('Cookie', user.cookie) : r;
    return payload ? withCookie.send(payload) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const list = async (query = '') =>
    (await call('get', `/api/admin/skill-topics/${topic.id}/questions${query}`, admin).expect(200)).body;
  const count = () => prisma.skillQuestion.count({ where: { topicId: topic.id } });
  const create = (u: TestUser, payload: object) => call('post', `/api/admin/skill-topics/${topic.id}/questions`, u, payload);

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
    topic = await prisma.topic.create({ data: { slug: `e2e-bank-${randomUUID()}`, name: 'E2E Bank' } });
    admin = await makeUser('admin');
    mod = await makeUser('moderator');
    student = await makeUser('student');
  }, SLOW);

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    if (topic) {
      await prisma?.skillQuestion.deleteMany({ where: { topicId: topic.id } });
      await prisma?.topic.deleteMany({ where: { id: topic.id } });
    }
    await app?.close();
  });

  it('học viên không vào được API ngân hàng câu', async () => {
    await call('get', '/api/admin/skill-topics', student).expect(403);
  }, SLOW);

  it('moderator và admin tạo câu easy: R = 1050, chưa có lượt, đáp án đúng thứ tự', async () => {
    const res = await create(mod, body('Câu 1')).expect(201);
    q1 = res.body;
    expect(q1).toMatchObject({ difficulty: 'easy', rating: 1050, answerCount: 0, correctCount: 0, archivedAt: null });
    expect(q1.options.map((o: { content: string }) => o.content)).toEqual(['Đáp án A', 'Đáp án B', 'Đáp án C']);
    q2 = (await create(admin, body('Câu 2')).expect(201)).body;
  }, SLOW);

  it('GET /api/admin/skill-topics có topic với active.easy = 2', async () => {
    const { body: topics } = await call('get', '/api/admin/skill-topics', admin).expect(200);
    expect(topics.find((t: { id: string }) => t.id === topic.id)).toMatchObject({
      active: { easy: 2, medium: 0, hard: 0 },
      archived: 0,
    });
  }, SLOW);

  it('PATCH đổi đề giữ độ khó thì giữ nguyên R và thống kê', async () => {
    await prisma.skillQuestion.update({ where: { id: q1.id }, data: { rating: 1100, answerCount: 5 } });
    const res = await call('patch', `/api/admin/skill-questions/${q1.id}`, mod, body('Câu 1 sửa')).expect(200);
    expect(res.body).toMatchObject({ stem: 'Câu 1 sửa', rating: 1100, answerCount: 5 });
  }, SLOW);

  it('PATCH đổi difficulty sang hard thì R = 1350 và xoá thống kê', async () => {
    await prisma.skillQuestion.update({ where: { id: q1.id }, data: { correctCount: 3 } });
    const res = await call('patch', `/api/admin/skill-questions/${q1.id}`, admin, body('Câu 1 sửa', 'hard')).expect(200);
    expect(res.body).toMatchObject({ difficulty: 'hard', rating: 1350, answerCount: 0, correctCount: 0 });
  }, SLOW);

  it('PATCH đổi type bị chặn SKILL_TYPE_LOCKED', async () => {
    const res = await call('patch', `/api/admin/skill-questions/${q1.id}`, admin, {
      type: 'multiple_choice',
      stem: 'Đổi loại',
      difficulty: 'hard',
      options: [
        { content: 'A', isCorrect: true },
        { content: 'B', isCorrect: true },
      ],
    }).expect(400);
    expect(res.body.code).toBe('SKILL_TYPE_LOCKED');
  }, SLOW);

  it('import 3 câu hợp lệ, mảng có câu sai thì 400 và không tạo gì', async () => {
    const before = await count();
    const url = `/api/admin/skill-topics/${topic.id}/questions/import`;
    const ok = await call('post', url, admin, { questions: [body('I1'), body('I2', 'medium'), body('I3', 'hard')] }).expect(201);
    expect(ok.body).toEqual({ created: 3 });
    expect(await count()).toBe(before + 3);

    const bad = { ...body('Sai'), options: [
      { content: 'A', isCorrect: true },
      { content: 'B', isCorrect: true },
    ] };
    await call('post', url, admin, { questions: [body('I4'), bad] }).expect(400);
    expect(await count()).toBe(before + 3);
    await create(admin, bad).expect(400); // refinement của quiz vẫn chạy sau safeExtend
  }, SLOW);

  it('archive rồi restore', async () => {
    const before = (await call('get', '/api/admin/skill-topics', admin).expect(200)).body.find(
      (t: { id: string }) => t.id === topic.id,
    ).archived;
    const res = await call('post', `/api/admin/skill-questions/${q2.id}/archive`, mod).expect(200);
    expect(res.body.archivedAt).not.toBeNull();
    expect((await list()).questions.some((q: { id: string }) => q.id === q2.id)).toBe(false);
    expect((await list('?status=archived')).questions.map((q: { id: string }) => q.id)).toContain(q2.id);
    const after = (await call('get', '/api/admin/skill-topics', admin).expect(200)).body.find(
      (t: { id: string }) => t.id === topic.id,
    ).archived;
    expect(after).toBe(before + 1);

    const back = await call('post', `/api/admin/skill-questions/${q2.id}/restore`, mod).expect(200);
    expect(back.body.archivedAt).toBeNull();
    expect((await list()).questions.some((q: { id: string }) => q.id === q2.id)).toBe(true);
  }, SLOW);

  it('topic hoặc câu không tồn tại thì 404', async () => {
    for (const id of [randomUUID(), 'khong-phai-uuid']) {
      const r = await call('get', `/api/admin/skill-topics/${id}/questions`, admin).expect(404);
      expect(r.body.code).toBe('TOPIC_NOT_FOUND');
      await call('post', `/api/admin/skill-topics/${id}/questions`, admin, body('x')).expect(404);
      const q = await call('post', `/api/admin/skill-questions/${id}/archive`, admin).expect(404);
      expect(q.body.code).toBe('SKILL_QUESTION_NOT_FOUND');
    }
  }, SLOW);

  it('lọc difficulty=hard chỉ trả câu hard', async () => {
    const { questions } = await list('?difficulty=hard');
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.every((q: { difficulty: string }) => q.difficulty === 'hard')).toBe(true);
  }, SLOW);
});
