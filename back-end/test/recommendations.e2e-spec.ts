// back-end/test/recommendations.e2e-spec.ts
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
const SLOW = 120_000;

type TestUser = { id: string; cookie: string };
type Group = { type: string; courses: { id: string; reason: Record<string, unknown> }[] };

describe('Gợi ý khoá theo mục tiêu / nghề (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên của mọi khoá test
  let stu: TestUser;
  let empty: TestUser;
  let react: string;
  let occTopic: string; // topic của nghề frontend_developer, khác react
  let courseReact: string;
  let courseOcc: string;
  let courseEnrolled: string;

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string, body?: object) => {
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
  const publishedCourse = async (title: string, topicId: string) => {
    const id = (await call('post', '/api/instructor/courses', alice.cookie, { title }).expect(201)).body.id as string;
    await call('patch', `/api/instructor/courses/${id}`, alice.cookie, { topics: [{ id: topicId, isPrimary: true }] }).expect(200);
    await prisma.course.update({ where: { id }, data: { status: 'published', ratingAvg: 5, level: 'all_levels' } });
    return id;
  };
  const groups = async (u: TestUser) => (await call('get', '/api/me/recommendations', u.cookie).expect(200)).body.groups as Group[];
  const find = (gs: Group[], courseId: string) =>
    gs.flatMap((g) => g.courses.map((c) => ({ type: g.type, ...c }))).find((c) => c.id === courseId);

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
    [alice, stu, empty] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    react = (await prisma.topic.findUniqueOrThrow({ where: { slug: 'react' }, select: { id: true } })).id;
    occTopic = (
      await prisma.occupationTopic.findFirstOrThrow({
        where: { occupation: 'frontend_developer', topicId: { not: react } },
        orderBy: { position: 'asc' },
        select: { topicId: true },
      })
    ).topicId;
    [courseReact, courseOcc, courseEnrolled] = await Promise.all([
      publishedCourse('E2E gợi ý React', react),
      publishedCourse('E2E gợi ý theo nghề', occTopic),
      publishedCourse('E2E đã ghi danh React', react),
    ]);
    await prisma.enrollment.create({ data: { userId: stu.id, courseId: courseEnrolled } });
  }, SLOW);

  afterAll(async () => {
    await prisma?.course.deleteMany({ where: { instructorId: alice?.id } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it('chưa đăng nhập → 401', async () => {
    await call('get', '/api/me/recommendations').expect(401);
  });

  it('chưa có mục tiêu, nghề → không nhóm nào', async () => {
    expect(await groups(empty)).toEqual([]);
  }, SLOW);

  it(
    'theo dõi React → khoá React ở goal; khoá đã ghi danh bị loại',
    async () => {
      await call('patch', '/api/me/preferences', stu.cookie, { topicIds: [react] }).expect(200);
      const gs = await groups(stu);
      expect(find(gs, courseReact)).toMatchObject({ type: 'goal', reason: { type: 'goal', topic: { id: react, slug: 'react' } } });
      expect(find(gs, courseEnrolled)).toBeUndefined();
    },
    SLOW,
  );

  it(
    'chọn nghề frontend → khoá theo nghề ở occupation kèm topic khớp; khoá React vẫn ở goal',
    async () => {
      await call('patch', '/api/me/preferences', stu.cookie, { occupation: 'frontend_developer' }).expect(200);
      const gs = await groups(stu);
      const occ = find(gs, courseOcc);
      expect(occ).toMatchObject({ type: 'occupation', reason: { type: 'occupation', occupation: 'frontend_developer' } });
      expect((occ!.reason.topics as { id: string }[]).map((t) => t.id)).toContain(occTopic);
      expect(find(gs, courseReact)?.type).toBe('goal');
    },
    SLOW,
  );

  it(
    'khoá của chính mình không được gợi ý',
    async () => {
      await call('patch', '/api/me/preferences', alice.cookie, { topicIds: [react] }).expect(200);
      expect(find(await groups(alice), courseReact)).toBeUndefined();
    },
    SLOW,
  );
});
