import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const SLOW = 120_000; // DB dev ~1-2s/query
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post';

describe('Ghi dữ liệu phân tích: đoạn video, lượt xem trang, thêm giỏ (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  const emails: string[] = [];
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendCourseNudge: vi.fn() };
  let alice: TestUser; // chủ khoá
  let s1: TestUser; // đã ghi danh
  let s2: TestUser; // chưa ghi danh
  let courseId: string;
  let draftId: string;
  let slug: string;
  let itemId: string;

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
  const progress = (user: TestUser, body: object) =>
    call('post', `/api/learn/${slug}/lectures/${itemId}/progress`, user.cookie, body);
  const segRows = () => prisma.videoWatchSegment.findMany({ where: { itemId }, orderBy: [{ viewId: 'asc' }, { seq: 'asc' }] });
  const viewCount = (id: string) => prisma.courseEvent.count({ where: { courseId: id, kind: 'page_view' } });

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
    redis = app.get(RedisService);
    [alice, s1, s2] = await Promise.all([makeUser('Alice'), makeUser('Học viên 1'), makeUser('Học viên 2')]);
    const asset = await prisma.asset.create({
      data: { ownerId: alice.id, kind: 'video', fileName: 'e2e.mp4', mimeType: 'video/mp4', sizeBytes: BigInt(2048), storageKey: `e2e/${randomUUID()}.mp4`, status: 'ready' },
      select: { id: true },
    });
    const base = { instructorId: alice.id, priceAmount: 199000 };
    const course = await prisma.course.create({
      data: { ...base, title: 'Khoá e2e ghi dữ liệu', slug: `e2e-track-${randomUUID()}`, status: 'published', publishedAt: new Date() },
      select: { id: true, slug: true },
    });
    const draft = await prisma.course.create({
      data: { ...base, title: 'Khoá nháp e2e', slug: `e2e-track-${randomUUID()}`, status: 'draft' },
      select: { id: true },
    });
    courseId = course.id;
    slug = course.slug;
    draftId = draft.id;
    const section = await prisma.section.create({ data: { courseId, title: 'Phần 1', position: 0 } });
    itemId = (
      await prisma.curriculumItem.create({
        data: {
          sectionId: section.id, courseId, type: 'lecture', lectureKind: 'video', videoAssetId: asset.id,
          title: 'Bài video', position: 0, durationSec: 600, isPublished: true,
        },
        select: { id: true },
      })
    ).id;
    await prisma.enrollment.create({ data: { userId: s1.id, courseId } });
  }, SLOW);

  // course cascade → item/enrollment/progress/segments/events; asset Restrict theo owner → xoá trước user.
  afterAll(async () => {
    const ids = [alice, s1, s2].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await redis?.del(`rl:learn-progress:${s1?.id}`);
    await app?.close();
  });

  it('progress kèm đoạn → 204, lưu từng đoạn theo seq và vị trí xem dở', async () => {
    const viewId = randomUUID();
    await progress(s1, { positionSec: 120, viewId, segments: [{ s: 0, e: 60 }, { s: 60, e: 120 }] }).expect(204);
    const rows = await segRows();
    expect(rows.map((r) => [r.viewId, r.seq, r.startSec, r.endSec])).toEqual([[viewId, 0, 0, 60], [viewId, 1, 60, 120]]);
    const ip = await prisma.itemProgress.findFirstOrThrow({ where: { itemId }, select: { lastPositionSec: true } });
    expect(ip.lastPositionSec).toBe(120);
  }, SLOW);

  it('tổng đoạn 500 s bị cắt ở trần 300 s, vị trí xem dở vẫn lưu', async () => {
    const viewId = randomUUID();
    await progress(s1, { positionSec: 290, viewId, segments: [{ s: 0, e: 250 }, { s: 250, e: 500 }] }).expect(204);
    const rows = (await segRows()).filter((r) => r.viewId === viewId);
    expect(rows.map((r) => [r.startSec, r.endSec])).toEqual([[0, 250], [250, 300]]);
    const ip = await prisma.itemProgress.findFirstOrThrow({ where: { itemId }, select: { lastPositionSec: true } });
    expect(ip.lastPositionSec).toBe(290);
  }, SLOW);

  it('đầu vào sai → 400', async () => {
    const seg = { s: 0, e: 10 };
    await progress(s1, { positionSec: 10, segments: [seg] }).expect(400);
    await progress(s1, { positionSec: 10, viewId: randomUUID(), segments: Array.from({ length: 21 }, () => seg) }).expect(400);
    await progress(s1, { positionSec: 10, viewId: randomUUID(), segments: [{ s: 10, e: 5 }] }).expect(400);
  }, SLOW);

  it('lượt xem trang: khách và người chưa ghi danh được ghi; chủ khoá, người đã ghi danh, khoá nháp thì không', async () => {
    const v = () => ({ visitorId: randomUUID() });
    const url = (id: string) => `/api/courses/${id}/view`;
    await call('post', url(courseId), undefined, v()).expect(204);
    expect(await prisma.courseEvent.count({ where: { courseId, kind: 'page_view', userId: null } })).toBe(1);
    await call('post', url(courseId), s2.cookie, v()).expect(204);
    expect(await prisma.courseEvent.count({ where: { courseId, kind: 'page_view', userId: s2.id } })).toBe(1);
    await call('post', url(courseId), s1.cookie, v()).expect(204);
    await call('post', url(courseId), alice.cookie, v()).expect(204);
    expect(await viewCount(courseId)).toBe(2);
    await call('post', url(draftId), undefined, v()).expect(204);
    expect(await viewCount(draftId)).toBe(0);
    await call('post', url('abc'), undefined, v()).expect(204);
    await call('post', url(courseId), undefined, { visitorId: 'x' }).expect(400);
    expect(await viewCount(courseId)).toBe(2);
  }, SLOW);

  it('thêm giỏ ghi cart_add (không chờ)', async () => {
    const res = await call('post', `/api/cart/${courseId}`, s2.cookie);
    expect(res.status).toBeLessThan(300);
    let n = 0;
    for (let i = 0; i < 30 && !n; i++) {
      n = await prisma.courseEvent.count({ where: { courseId, kind: 'cart_add', userId: s2.id } });
      if (!n) await sleep(500);
    }
    expect(n).toBe(1);
  }, SLOW);
});
