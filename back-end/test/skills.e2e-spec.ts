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
const MIN = 60_000;
const HOUR = 60 * MIN;

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post';

describe('Đánh giá kỹ năng (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let topic: { id: string; slug: string };
  let small: { id: string; slug: string };

  const call = (method: Method, path: string, user?: TestUser, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = user ? r.set('Cookie', user.cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const mkTopic = async (n: number) => {
    const t = await prisma.topic.create({ data: { slug: `e2e-skill-${randomUUID()}`, name: 'E2E Skill' } });
    for (let i = 0; i < n; i++) {
      await prisma.skillQuestion.create({
        data: {
          topicId: t.id, type: 'single_choice', stem: `Câu ${i}`, difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
          rating: [1050, 1200, 1350][i % 3],
          options: { create: [{ content: 'Đúng', isCorrect: true, position: 0 }, { content: 'Sai', isCorrect: false, position: 1 }] },
        },
      });
    }
    return t;
  };
  const correctOf = async (questionId: string) =>
    (await prisma.skillQuestionOption.findFirstOrThrow({ where: { questionId, isCorrect: true } })).id;
  const wrongOf = async (questionId: string) =>
    (await prisma.skillQuestionOption.findFirstOrThrow({ where: { questionId, isCorrect: false } })).id;
  const start = (u: TestUser, slug = topic.slug) => call('post', `/api/skills/${slug}/attempts`, u);
  const answer = (u: TestUser, attemptId: string, questionId: string, optionIds: string[]) =>
    call('post', `/api/skills/attempts/${attemptId}/answer`, u, { questionId, optionIds });
  // Trả lời đúng n câu liên tiếp, trả về state cuối.
  const answerRight = async (u: TestUser, first: { attemptId: string; question: { id: string } }, n: number) => {
    let state: any = first;
    for (let i = 0; i < n; i++) {
      state = (await answer(u, first.attemptId, state.question.id, [await correctOf(state.question.id)]).expect(200)).body;
    }
    return state;
  };
  const backdate = (attemptId: string, ms: number) =>
    prisma.skillAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() - ms) } });

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
    topic = await mkTopic(14); // mở
    small = await mkTopic(11); // chưa đủ 12 câu
  }, SLOW);

  // Xoá user trước (cascade attempts/answers/user_topic_skills — answers trỏ tới câu hỏi); xoá topic cascade luôn câu hỏi.
  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await prisma?.topic.deleteMany({ where: { id: { in: [topic, small].filter(Boolean).map((t) => t.id) } } });
    await app?.close();
  });

  it('GET /api/skills liệt kê topic đủ câu, bỏ topic thiếu câu', async () => {
    const u = await makeUser();
    const { topics } = (await call('get', '/api/skills', u).expect(200)).body;
    expect(topics.find((t: { slug: string }) => t.slug === topic.slug)).toMatchObject({ pct: null, answerCount: 0 });
    expect(topics.some((t: { slug: string }) => t.slug === small.slug)).toBe(false);
  }, SLOW);

  it('start trả câu 1/12, hạn ≈ +15 phút, không lộ isCorrect', async () => {
    const u = await makeUser();
    const s = (await start(u).expect(200)).body;
    expect(s).toMatchObject({ state: 'question', position: 1, total: 12 });
    expect(new Date(s.deadlineAt).getTime() - Date.now()).toBeGreaterThan(14 * MIN);
    expect(new Date(s.deadlineAt).getTime() - Date.now()).toBeLessThan(16 * MIN);
    for (const o of s.question.options) expect(Object.keys(o).sort()).toEqual(['content', 'id']);
  }, SLOW);

  it('đúng cả 12 câu → kết quả, R tăng, lịch sử 1 điểm', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    const r = await answerRight(u, first, 12);
    expect(r).toMatchObject({ state: 'result', status: 'submitted', answered: 12, correct: 12, pctBefore: null });
    expect(r.pctAfter).toBeGreaterThan(30);
    expect(r.items).toHaveLength(12);
    const rows = await prisma.skillAnswer.findMany({ where: { attemptId: first.attemptId } });
    expect(new Set(rows.map((x) => x.questionId)).size).toBe(12);
    const skill = await prisma.userTopicSkill.findUniqueOrThrow({ where: { userId_topicId: { userId: u.id, topicId: topic.id } } });
    expect(skill.rating).toBeGreaterThan(1200);
    expect(skill.answerCount).toBe(12);
    const ov = (await call('get', '/api/skills', u).expect(200)).body;
    const t = ov.topics.find((x: { slug: string }) => x.slug === topic.slug);
    expect(t.pct).toBe(r.pctAfter);
    expect(Math.abs(new Date(t.nextAvailableAt).getTime() - (new Date(r.startedAt).getTime() + 24 * HOUR))).toBeLessThan(5_000);
    expect(ov.history).toHaveLength(1);
    // Làm lại trong 24h → cooldown.
    const again = await start(u).expect(409);
    expect(again.body).toMatchObject({ code: 'SKILL_COOLDOWN' });
    expect(again.body.nextAvailableAt).toBeTruthy();
  }, SLOW);

  it('làm tiếp lượt đang mở: cùng attemptId, câu đang hiện', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    const second = (await answer(u, first.attemptId, first.question.id, [await correctOf(first.question.id)]).expect(200)).body;
    const again = (await start(u).expect(200)).body;
    expect(again.attemptId).toBe(first.attemptId);
    expect(again.position).toBe(2);
    expect(again.question.id).toBe(second.question.id);
    const got = (await call('get', `/api/skills/attempts/${first.attemptId}`, u).expect(200)).body;
    expect(got.question.id).toBe(second.question.id);
    const ov = (await call('get', '/api/skills', u).expect(200)).body;
    const t = ov.topics.find((x: { slug: string }) => x.slug === topic.slug);
    expect(t.inProgressAttemptId).toBe(first.attemptId);
    // Đang làm dở: không lộ tiến độ trong lượt (chưa đo trước đó → null / 0).
    expect(t).toMatchObject({ pct: null, answerCount: 0 });
  }, SLOW);

  it('câu cũ → 409 SKILL_STALE_QUESTION; đáp án của câu khác → 400 SKILL_BAD_OPTION', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    const second = (await answer(u, first.attemptId, first.question.id, [await correctOf(first.question.id)]).expect(200)).body;
    const stale = await answer(u, first.attemptId, first.question.id, [await correctOf(first.question.id)]).expect(409);
    expect(stale.body.code).toBe('SKILL_STALE_QUESTION');
    const bad = await answer(u, first.attemptId, second.question.id, [await wrongOf(first.question.id)]).expect(400);
    expect(bad.body.code).toBe('SKILL_BAD_OPTION');
  }, SLOW);

  it('"Tôi không biết" đi tiếp, ghi skipped', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    let state = (await answer(u, first.attemptId, first.question.id, []).expect(200)).body;
    expect(state.position).toBe(2);
    state = await answerRight(u, { attemptId: first.attemptId, question: state.question }, 11);
    expect(state.state).toBe('result');
    expect(state.items[0]).toMatchObject({ skipped: true, isCorrect: false });
  }, SLOW);

  it('hết giờ giữa chừng → expired, câu chưa làm isCorrect null', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    const s2 = await answerRight(u, first, 2);
    await backdate(first.attemptId, 16 * MIN);
    const r = (await answer(u, first.attemptId, s2.question.id, [await correctOf(s2.question.id)]).expect(200)).body;
    expect(r).toMatchObject({ state: 'result', status: 'expired', answered: 2 });
    expect(r.items[2].isCorrect).toBeNull();
  }, SLOW);

  it('trả lời trong grace → câu được tính, lượt đóng expired, finishedAt = hạn', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    await backdate(first.attemptId, 15 * MIN + 5_000); // quá hạn 5 s, còn trong GRACE_MS
    const r = (await answer(u, first.attemptId, first.question.id, [await correctOf(first.question.id)]).expect(200)).body;
    expect(r).toMatchObject({ state: 'result', status: 'expired', answered: 1, correct: 1 });
    expect(new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()).toBe(15 * MIN);
  }, SLOW);

  it('GET lượt quá hạn chưa trả lời câu nào → expired, R không đổi', async () => {
    const u = await makeUser();
    const first = (await start(u).expect(200)).body;
    await backdate(first.attemptId, 16 * MIN);
    const r = (await call('get', `/api/skills/attempts/${first.attemptId}`, u).expect(200)).body;
    expect(r).toMatchObject({ state: 'result', status: 'expired', answered: 0 });
    expect(r.ratingAfter).toBe(r.ratingBefore);
  }, SLOW);

  it('start song song → cùng attemptId, chỉ 1 lượt in_progress', async () => {
    const u = await makeUser();
    const [a, b] = await Promise.all([start(u), start(u)]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.attemptId).toBe(b.body.attemptId);
    expect(await prisma.skillAttempt.count({ where: { userId: u.id, status: 'in_progress' } })).toBe(1);
  }, SLOW);

  it('topic thiếu câu hoặc không tồn tại → 404 SKILL_TOPIC_NOT_FOUND', async () => {
    const u = await makeUser();
    expect((await start(u, small.slug).expect(404)).body.code).toBe('SKILL_TOPIC_NOT_FOUND');
    await start(u, `khong-ton-tai-${randomUUID()}`).expect(404);
  }, SLOW);

  it('lượt của người khác → 404 SKILL_ATTEMPT_NOT_FOUND; id lạ → 404', async () => {
    const [u, other] = await Promise.all([makeUser(), makeUser()]);
    const first = (await start(u).expect(200)).body;
    expect((await call('get', `/api/skills/attempts/${first.attemptId}`, other).expect(404)).body.code).toBe('SKILL_ATTEMPT_NOT_FOUND');
    await answer(other, first.attemptId, first.question.id, []).expect(404);
    await call('get', '/api/skills/attempts/not-a-uuid', u).expect(404);
  }, SLOW);

  it('chưa đăng nhập → 401', async () => {
    await call('get', '/api/skills').expect(401);
  }, SLOW);
});
