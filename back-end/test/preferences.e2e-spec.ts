import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
// Rate limit Better Auth nằm ở Redis → mỗi request một IP (xem auth.e2e-spec).
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };
type Ref = { id: string; slug: string; name: string };

describe('Personalize (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  }, 120_000);

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } }); // user_target_topics cascade
    await app?.close();
  });

  describe('GET /api/topics/popular', () => {
    it('frontend_developer → đúng thứ tự position của seed', async () => {
      const { body } = await call('get', '/api/topics/popular?occupation=frontend_developer').expect(200);
      expect((body as Ref[]).slice(0, 3).map((t) => t.slug)).toEqual(['html', 'css', 'javascript']);
      expect(Object.keys(body[0]).sort()).toEqual(['id', 'name', 'slug']);
    });

    it('other → [] ; nghề sai / thiếu → 400', async () => {
      const { body } = await call('get', '/api/topics/popular?occupation=other').expect(200);
      expect(body).toEqual([]);
      await call('get', '/api/topics/popular?occupation=chef').expect(400);
      await call('get', '/api/topics/popular').expect(400);
    });
  });

  describe('/api/me/preferences', () => {
    let u: TestUser;
    let topics: Ref[];
    const prefs = () => call('get', '/api/me/preferences', u.cookie).expect(200).then((r) => r.body);
    type Err = { path: string[]; message: string };

    beforeAll(async () => {
      u = await makeUser();
      topics = await prisma.topic.findMany({ take: 3, orderBy: { slug: 'asc' }, select: { id: true, slug: true, name: true } });
    }, 120_000);

    it('chưa đăng nhập → 401', async () => {
      await call('get', '/api/me/preferences').expect(401);
      await call('patch', '/api/me/preferences').send({}).expect(401);
    });

    it('user mới → tất cả trống; body {} không đổi gì', async () => {
      expect(await prefs()).toEqual({ occupation: null, level: null, topics: [] });
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({}).expect(200);
      expect(body).toEqual({ occupation: null, level: null, topics: [] });
    });

    it('PATCH từng field riêng → GET và /api/me thấy ngay', async () => {
      await call('patch', '/api/me/preferences', u.cookie).send({ occupation: 'backend_developer' }).expect(200);
      await call('patch', '/api/me/preferences', u.cookie).send({ level: 'intermediate' }).expect(200);
      expect(await prefs()).toMatchObject({ occupation: 'backend_developer', level: 'intermediate' });
      const me = await call('get', '/api/me', u.cookie).expect(200);
      expect(me.body).toMatchObject({ occupation: 'backend_developer', level: 'intermediate' });
      // {} không xoá giá trị đang có
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({}).expect(200);
      expect(body).toMatchObject({ occupation: 'backend_developer', level: 'intermediate' });
    });

    it('topicIds lần sau thay hẳn lần trước', async () => {
      await call('patch', '/api/me/preferences', u.cookie).send({ topicIds: [topics[0].id, topics[1].id] }).expect(200);
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({ topicIds: [topics[2].id] }).expect(200);
      expect(body.topics).toEqual([topics[2]]);
      expect(await prisma.userTargetTopic.count({ where: { userId: u.id } })).toBe(1);
    });

    it('topic không tồn tại → 400 path topicIds, danh sách cũ còn nguyên', async () => {
      const res = await call('patch', '/api/me/preferences', u.cookie)
        .send({ topicIds: [topics[0].id, randomUUID()] })
        .expect(400);
      expect((res.body.errors as Err[]).map((e) => e.path)).toEqual([['topicIds']]);
      expect((await prefs()).topics).toEqual([topics[2]]);
    });

    it('enum sai / all_levels / trùng / >30 / trường lạ → 400', async () => {
      const bad = (body: object) => call('patch', '/api/me/preferences', u.cookie).send(body).expect(400);
      await bad({ occupation: 'chef' });
      await bad({ level: 'all_levels' });
      await bad({ topicIds: [topics[0].id, topics[0].id] });
      await bad({ topicIds: Array.from({ length: 31 }, () => randomUUID()) });
      await bad({ targetTrack: 'frontend' });
    });

    it('null xoá lựa chọn', async () => {
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({ occupation: null, level: null, topicIds: [] }).expect(200);
      expect(body).toEqual({ occupation: null, level: null, topics: [] });
    });
  });

  it('sign-up gửi kèm occupation → 400 (input: false)', async () => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    const res = await call('post', '/api/auth/sign-up/email')
      .send({ name: 'E2E', email, password: PASSWORD, occupation: 'frontend_developer' })
      .expect(400);
    expect(res.body.message).toMatch(/occupation is not allowed to be set/);
  });
});
