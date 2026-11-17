import { BadGatewayException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AssetsCleanupService } from '../src/assets/assets-cleanup.service.js';
import { GB, LIMITS, videoMonthKey } from '../src/assets/limits.js';
import { requireEnv } from '../src/env.js';
import { MediaConvertGateway } from '../src/hls/mediaconvert.gateway.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeMediaConvert } from './fake-mediaconvert.js';
import { FakeStorage } from './fake-storage.js';
import { mp4, pdf } from './fixtures/files.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'put' | 'delete';

describe('Kiểm soát lưu trữ (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  const storage = new FakeStorage();
  const mc = new FakeMediaConvert();
  const emails: string[] = [];
  const users: TestUser[] = [];

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
    const user = { id: res.body.user.id as string, cookie: cookieOf(res) };
    users.push(user);
    return user;
  };
  // Dòng asset dựng thẳng trong DB (không qua upload).
  const row = (u: TestUser, data: Partial<Prisma.AssetUncheckedCreateInput> = {}) => {
    const kind = data.kind === 'video' ? 'video' : 'document';
    return prisma.asset.create({
      data: {
        ownerId: u.id,
        kind,
        fileName: kind === 'video' ? 'bai.mp4' : 'tai-lieu.pdf',
        mimeType: kind === 'video' ? 'video/mp4' : 'application/pdf',
        sizeBytes: 1000,
        storageKey: `${kind === 'video' ? 'videos' : 'documents'}/${u.id}/${randomUUID()}.${kind === 'video' ? 'mp4' : 'pdf'}`,
        status: 'ready',
        ...data,
      },
    });
  };
  const askPdf = (u: TestUser, sizeBytes: number) =>
    call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind: 'document',
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      sizeBytes,
    });
  const askVideo = (u: TestUser, sizeBytes: number, durationSec: number) =>
    call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind: 'video',
      fileName: 'bai.mp4',
      mimeType: 'video/mp4',
      sizeBytes,
      durationSec,
    });
  const completeOf = (u: TestUser, assetId: string) => call('post', `/api/instructor/assets/${assetId}/complete`, u.cookie);
  const assetOf = (id: string) => prisma.asset.findUniqueOrThrow({ where: { id } });
  const counter = async (u: TestUser) => Number(await redis.get(videoMonthKey(u.id))) || 0;
  const setCounter = (u: TestUser, sec: number) => redis.set(videoMonthKey(u.id), sec, 'EX', 3600);
  // Khoá mới có sẵn chương "Giới thiệu" với một bài giảng "Giới thiệu": gắn asset vào bài đó bằng API soạn khoá.
  const lectureWith = async (u: TestUser, assetId: string, courseTitle = 'Khoá e2e thư viện') => {
    const courseId = (await call('post', '/api/instructor/courses', u.cookie, { title: courseTitle }).expect(201)).body
      .id as string;
    const base = `/api/instructor/courses/${courseId}`;
    const tree = await call('get', `${base}/curriculum`, u.cookie).expect(200);
    const item = tree.body.sections[0].items[0];
    await call('put', `${base}/items/${item.id}/content`, u.cookie, { assetId }).expect(200);
    return { courseId, itemId: item.id as string };
  };

  beforeAll(async () => {
    vi.stubEnv('MEDIACONVERT_ROLE_ARN', 'arn:aws:iam::000000000000:role/e2e');
    vi.stubEnv('MEDIACONVERT_WEBHOOK_SECRET', 'e2e-storage-control');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(storage)
      .overrideProvider(MediaConvertGateway)
      .useValue(mc)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  }, SLOW);

  // Dọn: khoá trước (bài giảng → asset là Restrict), asset, hồ sơ giảng viên, user, khoá Redis của test.
  afterAll(async () => {
    const ids = users.map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.instructorProfile.deleteMany({ where: { userId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    const keys = ids.flatMap((id) => [videoMonthKey(id), `rl:upload:${id}`]);
    if (keys.length) await redis?.del(...keys);
    await app?.close();
    vi.unstubAllEnvs();
  });

  describe('hạn mức', () => {
    it('dung lượng: đầy → 400; dòng tải dở quá 1 giờ và dòng lỗi không tính', async () => {
      const u = await makeUser();
      const big = await row(u, { sizeBytes: LIMITS.standard.storageBytes - 500 });
      await row(u, { status: 'uploading', sizeBytes: GB, createdAt: new Date(Date.now() - 2 * HOUR) });
      await row(u, { status: 'failed', sizeBytes: GB });
      await askPdf(u, 500).expect(201); // vừa khít, dòng uploading mới 500 byte được tính từ đây
      const res = await askPdf(u, 1).expect(400);
      expect(res.body.errors[0].message).toBe(
        'Đã dùng 5 / 5 GB dung lượng. Hãy xoá bớt file chưa dùng trong Thư viện file',
      );
      await prisma.asset.delete({ where: { id: big.id } });
      await askPdf(u, 1).expect(201);
    }, SLOW);

    it('giảng viên có hồ sơ đã duyệt dùng mức 50 GB', async () => {
      const u = await makeUser();
      await row(u, { sizeBytes: LIMITS.standard.storageBytes });
      await askPdf(u, 1).expect(400);
      await prisma.instructorProfile.create({ data: { userId: u.id } });
      await askPdf(u, 1).expect(201);
    }, SLOW);

    it('quá số lượt xin link trong một giờ → 429', async () => {
      const u = await makeUser();
      await redis.set(`rl:upload:${u.id}`, 60, 'EX', 3600);
      const res = await askPdf(u, 10).expect(429);
      expect(res.body.code).toBe('RATE_LIMITED');
    }, SLOW);

    it('phút video: hết lúc xin link → 400; còn thì complete cộng vào bộ đếm', async () => {
      const u = await makeUser();
      const limit = LIMITS.standard.videoSecondsPerMonth;
      await setCounter(u, limit - 60);
      const over = await askVideo(u, 100, 61).expect(400);
      expect(over.body.errors[0].message).toBe(
        'Tháng này bạn đã tải lên 119 / 120 phút video. Hạn mức sẽ làm mới vào đầu tháng sau',
      );
      const body = mp4(10);
      const ticket = await askVideo(u, body.length, 60).expect(201);
      storage.put('video', ticket.body.key, body);
      const done = await completeOf(u, ticket.body.assetId).expect(200);
      expect(done.body.status).toBe('processing');
      expect(await counter(u)).toBe(limit);
    }, SLOW);

    it('phút video: hết lúc complete → 400, file bị xoá, dòng lỗi, bộ đếm giữ nguyên', async () => {
      const u = await makeUser();
      const limit = LIMITS.standard.videoSecondsPerMonth;
      const body = mp4(10);
      const ticket = await askVideo(u, body.length, 60).expect(201);
      storage.put('video', ticket.body.key, body);
      await setCounter(u, limit - 10); // một video khác vừa dùng gần hết trong lúc đang tải
      const jobs = mc.jobs.size;
      const res = await completeOf(u, ticket.body.assetId).expect(400);
      expect(res.body.errors[0].message).toContain('119 / 120 phút video');
      expect(storage.has('video', ticket.body.key)).toBe(false);
      expect((await assetOf(ticket.body.assetId)).status).toBe('failed');
      expect(await counter(u)).toBe(limit - 10);
      expect(mc.jobs.size).toBe(jobs);
    }, SLOW);

    it('hai lượt complete cùng lúc chỉ cộng phút một lần; gửi job lỗi thì không cộng', async () => {
      const u = await makeUser();
      const body = mp4(10);
      const a = await askVideo(u, body.length, 100).expect(201);
      storage.put('video', a.body.key, body);
      const both = await Promise.all([completeOf(u, a.body.assetId), completeOf(u, a.body.assetId)]);
      expect(both.map((r) => r.status).sort((x, y) => x - y)).toEqual([200, 404]);
      expect(await counter(u)).toBe(100);

      const b = await askVideo(u, body.length, 50).expect(201);
      storage.put('video', b.body.key, body);
      vi.spyOn(mc, 'createJob').mockRejectedValueOnce(new BadGatewayException());
      await completeOf(u, b.body.assetId).expect(502);
      expect(await counter(u)).toBe(100);
      expect((await assetOf(b.body.assetId)).status).toBe('uploading');
    }, SLOW);

    it('dòng tải lên quá 1 giờ complete khi dung lượng đã đầy → 400, file bị xoá, dòng lỗi', async () => {
      const u = await makeUser();
      const ticket = await askPdf(u, pdf.length).expect(201);
      storage.put('private', ticket.body.key, pdf);
      await prisma.asset.update({ where: { id: ticket.body.assetId }, data: { createdAt: new Date(Date.now() - 2 * HOUR) } });
      await row(u, { sizeBytes: LIMITS.standard.storageBytes });
      await completeOf(u, ticket.body.assetId).expect(400);
      expect(storage.has('private', ticket.body.key)).toBe(false);
      expect((await assetOf(ticket.body.assetId)).status).toBe('failed');
    }, SLOW);
  });

  describe('thư viện', () => {
    it('danh sách: ba nhóm lọc không chồng nhau, số lần dùng, tìm kiếm, phân trang, mức đã dùng', async () => {
      const u = await makeUser();
      const used = await row(u, { fileName: 'dang-dung.pdf', sizeBytes: 3000 });
      const unused = await row(u, { fileName: 'chua-dung.pdf', sizeBytes: 2000 });
      const failed = await row(u, { fileName: 'loi.pdf', status: 'failed' });
      const stale = await row(u, { fileName: 'bo-do.pdf', status: 'uploading', createdAt: new Date(Date.now() - 2 * HOUR) });
      await lectureWith(u, used.id);

      const all = await call('get', '/api/instructor/assets/library', u.cookie).expect(200);
      expect(all.body.counts).toEqual({ all: 4, used: 1, unused: 1, failed: 2 });
      expect(all.body.total).toBe(4);
      expect(all.body.totalBytes).toBe(5000);
      expect(all.body.quotaBytes).toBe(LIMITS.standard.storageBytes);
      expect(all.body.videoSecondsUsed).toBe(0);
      expect(all.body.videoSecondsLimit).toBe(LIMITS.standard.videoSecondsPerMonth);
      const byId = new Map((all.body.items as { id: string; status: string; usageCount: number }[]).map((f) => [f.id, f]));
      expect(byId.get(used.id)).toMatchObject({ status: 'ready', usageCount: 1 });
      expect(byId.get(unused.id)).toMatchObject({ status: 'ready', usageCount: 0 });
      expect(byId.get(stale.id)?.status).toBe('failed');

      const ids = async (qs: string) =>
        ((await call('get', `/api/instructor/assets/library?${qs}`, u.cookie).expect(200)).body.items as { id: string }[]).map(
          (f) => f.id,
        );
      expect(await ids('filter=used')).toEqual([used.id]);
      expect(await ids('filter=unused')).toEqual([unused.id]);
      expect((await ids('filter=failed')).sort()).toEqual([failed.id, stale.id].sort());
      expect(await ids('q=CHUA')).toEqual([unused.id]);
      // Cũ nhất trước: bo-do (lùi 2 giờ), rồi theo thứ tự tạo.
      expect(await ids('pageSize=1&page=1&order=asc')).toEqual([stale.id]);
      expect(await ids('pageSize=1&page=2&order=asc')).toEqual([used.id]);
      await call('get', '/api/instructor/assets/library?pageSize=51', u.cookie).expect(400);
    }, SLOW);

    it('nơi dùng: trả khoá, chương, bài; file của người khác → 404', async () => {
      const u = await makeUser();
      const other = await makeUser();
      const file = await row(u);
      const { courseId, itemId } = await lectureWith(u, file.id, 'Khoá nơi dùng');
      const res = await call('get', `/api/instructor/assets/${file.id}/usages`, u.cookie).expect(200);
      expect(res.body).toEqual([
        { itemId, courseId, courseTitle: 'Khoá nơi dùng', sectionTitle: 'Giới thiệu', lectureTitle: 'Giới thiệu' },
      ]);
      await call('get', `/api/instructor/assets/${file.id}/usages`, other.cookie).expect(404);
      await call('get', '/api/instructor/assets/khong-phai-id/usages', u.cookie).expect(404);
    }, SLOW);

    it('xoá: đang dùng / đang xử lý → 409 kèm mã; của người khác → 404; hợp lệ → 204, mất cả file gốc lẫn thư mục HLS', async () => {
      const u = await makeUser();
      const other = await makeUser();
      const inUse = await row(u);
      await lectureWith(u, inUse.id);
      const busy = await call('delete', `/api/instructor/assets/${inUse.id}`, u.cookie).expect(409);
      expect(busy.body.code).toBe('ASSET_IN_USE');

      const processing = await row(u, { kind: 'video', status: 'processing', hlsJobId: `fake-${randomUUID()}` });
      const backfill = await row(u, { kind: 'video', status: 'ready', hlsJobId: `fake-${randomUUID()}` });
      for (const a of [processing, backfill]) {
        const res = await call('delete', `/api/instructor/assets/${a.id}`, u.cookie).expect(409);
        expect(res.body.code).toBe('ASSET_PROCESSING');
      }

      const video = await row(u, { kind: 'video', hlsKey: 'x' });
      storage.put('video', video.storageKey, mp4(10));
      storage.put('video', `hls/${video.id}/index.m3u8`, Buffer.from('m3u8'));
      storage.put('video', `hls/${video.id}/index_720p_00001.ts`, Buffer.from('ts'));
      await call('delete', `/api/instructor/assets/${video.id}`, other.cookie).expect(404);
      await call('delete', `/api/instructor/assets/${video.id}`, u.cookie).expect(204);
      expect(await prisma.asset.findUnique({ where: { id: video.id } })).toBeNull();
      expect(storage.has('video', video.storageKey)).toBe(false);
      expect(await storage.list('video', `hls/${video.id}/`)).toEqual([]);
    }, SLOW);

    it('link tải về mang tên file gốc; video tải về là bản MP4 gốc', async () => {
      const u = await makeUser();
      const doc = await row(u, { fileName: 'Đề cương.pdf' });
      const res = await call('get', `/api/instructor/assets/${doc.id}/url?download=1`, u.cookie).expect(200);
      expect(res.body.url).toContain(`download=${encodeURIComponent('Đề cương.pdf')}`);
      const video = await row(u, { kind: 'video', hlsKey: 'hls/x/index.m3u8' });
      const dl = await call('get', `/api/instructor/assets/${video.id}/url?download=1`, u.cookie).expect(200);
      expect(dl.body.url).toContain(`fake.r2/video/${video.storageKey}`);
    }, SLOW);
  });

  describe('dọn rác', () => {
    it('file tải dở / lỗi quá 24 giờ, không bài nào dùng: xoá cả dòng lẫn file; còn lại giữ', async () => {
      const u = await makeUser();
      const old = new Date(Date.now() - DAY - HOUR);
      const staleUpload = await row(u, { status: 'uploading', createdAt: old });
      const staleFailed = await row(u, { kind: 'video', status: 'failed', createdAt: old });
      const fresh = await row(u, { status: 'uploading' });
      const oldReady = await row(u, { createdAt: old });
      // Dòng lỗi còn được bài giảng dùng: gắn khi còn ready rồi mới đổi thành failed.
      const failedInUse = await row(u, { createdAt: old });
      await lectureWith(u, failedInUse.id);
      await prisma.asset.update({ where: { id: failedInUse.id }, data: { status: 'failed' } });
      storage.put('private', staleUpload.storageKey, pdf);
      storage.put('video', staleFailed.storageKey, mp4(10));
      storage.put('video', `hls/${staleFailed.id}/index.m3u8`, Buffer.from('m3u8'));

      const removed = await app.get(AssetsCleanupService).purgeStaleUploads({ ownerId: u.id });
      expect(removed).toBe(2);
      const left = (await prisma.asset.findMany({ where: { ownerId: u.id }, select: { id: true } })).map((a) => a.id);
      expect(left.sort()).toEqual([fresh.id, oldReady.id, failedInUse.id].sort());
      expect(storage.has('private', staleUpload.storageKey)).toBe(false);
      expect(storage.has('video', staleFailed.storageKey)).toBe(false);
      expect(await storage.list('video', `hls/${staleFailed.id}/`)).toEqual([]);
    }, SLOW);

    it('video giới thiệu quá 24 giờ không khoá nào dùng: xoá; cái đang dùng và cái mới: giữ', async () => {
      const u = await makeUser();
      const old = new Date(Date.now() - DAY - HOUR);
      const key = (name: string) => `promos/${u.id}/${name}.mp4`;
      storage.put('public', key('khong-dung'), mp4(10), old);
      storage.put('public', key('dang-dung'), mp4(10), old);
      storage.put('public', key('moi'), mp4(10));
      const courseId = (await call('post', '/api/instructor/courses', u.cookie, { title: 'Khoá có video giới thiệu' }).expect(201))
        .body.id as string;
      await prisma.course.update({ where: { id: courseId }, data: { promoVideoUrl: storage.publicUrl(key('dang-dung')) } });

      const removed = await app.get(AssetsCleanupService).purgeUnusedPromos(`promos/${u.id}/`);
      expect(removed).toBe(1);
      expect(storage.has('public', key('khong-dung'))).toBe(false);
      expect(storage.has('public', key('dang-dung'))).toBe(true);
      expect(storage.has('public', key('moi'))).toBe(true);
    }, SLOW);
  });
});
