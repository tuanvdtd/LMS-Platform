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
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string }[] }[] };

describe('Học viên học bài giảng (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên
  let stu: TestUser; // học viên đã ghi danh
  let carol: TestUser; // chưa ghi danh
  let courseId: string;
  let slug: string;
  let sectionId: string;
  let enrollmentId: string;
  let videoId: string; // video 600s = 60 đoạn
  let pdfId: string; // PDF, cho tải
  let zeroId: string; // video durationSec 0 → đánh dấu tay
  let hiddenId: string; // bài giảng chưa xuất bản
  let resourceId: string;
  let hiddenResourceId: string;
  const keys = { video: `e2e/${randomUUID()}.mp4`, zero: `e2e/${randomUUID()}.mp4`, pdf: `e2e/${randomUUID()}.pdf`, res: `e2e/${randomUUID()}.pdf` };

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
  const addLecture = async (title: string) => {
    const tree = (await as('post', `/sections/${sectionId}/items`, { type: 'lecture', title }).expect(201)).body as Tree;
    return tree.sections.find((s) => s.id === sectionId)!.items.at(-1)!.id;
  };
  const makeAsset = (kind: 'video' | 'document', storageKey: string, fileName: string, sizeBytes = 2048) =>
    prisma.asset.create({
      data: {
        ownerId: alice.id,
        kind,
        fileName,
        mimeType: kind === 'video' ? 'video/mp4' : 'application/pdf',
        sizeBytes: BigInt(sizeBytes),
        storageKey,
        status: 'ready',
      },
      select: { id: true },
    });
  const learn = (method: Method, path = '', user = stu, body?: object) =>
    call(method, `/api/learn/${slug}${path}`, user.cookie, body);
  const progressRow = () =>
    prisma.itemProgress.findUniqueOrThrow({ where: { enrollmentId_itemId: { enrollmentId, itemId: videoId } } });

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
    redis = app.get(RedisService);
    [alice, stu, carol] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e học bài giảng' }).expect(201))
      .body.id as string;
    sectionId = ((await as('post', '/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    videoId = await addLecture('Video 10 phút');
    pdfId = await addLecture('Bài đọc PDF');
    zeroId = await addLecture('Video không rõ thời lượng');
    hiddenId = await addLecture('Bài chưa xuất bản');
    await as('post', '/sections', { title: 'Phần rỗng' }).expect(201);
    const [video, zero, pdf, res] = await Promise.all([
      makeAsset('video', keys.video, 'video.mp4'),
      makeAsset('video', keys.zero, 'zero.mp4'),
      makeAsset('document', keys.pdf, 'bai-doc.pdf'),
      makeAsset('document', keys.res, 'slide.pdf'),
    ]);
    // Gắn nội dung thẳng bằng Prisma (bỏ qua luồng upload) — thoả chk_item_payload.
    await prisma.curriculumItem.update({
      where: { id: videoId },
      data: { lectureKind: 'video', videoAssetId: video.id, durationSec: 600, description: 'Mô tả bài', isPublished: true },
    });
    await prisma.curriculumItem.update({
      where: { id: pdfId },
      data: { lectureKind: 'document', documentAssetId: pdf.id, isDownloadable: true, isPublished: true },
    });
    await prisma.curriculumItem.update({
      where: { id: zeroId },
      data: { lectureKind: 'video', videoAssetId: zero.id, durationSec: 0, isPublished: true },
    });
    [resourceId, hiddenResourceId] = (
      await Promise.all([
        prisma.lectureResource.create({ data: { itemId: videoId, assetId: res.id, title: 'Slide', position: 0 }, select: { id: true } }),
        prisma.lectureResource.create({ data: { itemId: hiddenId, assetId: res.id, title: 'Ẩn', position: 0 }, select: { id: true } }),
      ])
    ).map((r) => r.id);
    const [course, enrollment] = await Promise.all([
      prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } }),
      prisma.enrollment.create({ data: { userId: stu.id, courseId }, select: { id: true } }),
    ]);
    slug = course.slug;
    enrollmentId = enrollment.id;
  }, SLOW);

  // course cascade → item/resource/enrollment/progress/note; asset Restrict theo owner → xoá trước user.
  afterAll(async () => {
    const ids = [alice, stu, carol].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await redis?.del(`rl:learn-progress:${stu?.id}`);
    await app?.close();
  });

  it(
    'mục lục: khoá sai → 404; chưa ghi danh → 403; chỉ bài đã xuất bản, bỏ phần rỗng',
    async () => {
      expect((await call('get', '/api/learn/khong-co-khoa-nay', stu.cookie).expect(404)).body.code).toBe('COURSE_NOT_FOUND');
      expect((await learn('get', '', carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      const { body } = await learn('get').expect(200);
      expect(body.course).toEqual({ id: courseId, slug, title: 'Khoá e2e học bài giảng' });
      expect(body).toMatchObject({ progressPct: 0, completedAt: null, resumeItemId: videoId });
      expect(body.sections).toHaveLength(1);
      expect(body.sections[0].items.map((i: { id: string }) => i.id)).toEqual([videoId, pdfId, zeroId]);
      expect(body.sections[0].items[0]).toEqual({
        id: videoId,
        type: 'lecture',
        title: 'Video 10 phút',
        lectureKind: 'video',
        durationSec: 600,
        completed: false,
      });
    },
    SLOW,
  );

  it(
    'bài giảng: 404 trước 403; video có link + tài liệu; PDF có link tải; video 0s đánh dấu tay',
    async () => {
      for (const id of [hiddenId, randomUUID(), 'abc']) {
        expect((await learn('get', `/lectures/${id}`).expect(404)).body.code).toBe('LECTURE_NOT_FOUND');
      }
      expect((await learn('get', `/lectures/${hiddenId}`, carol).expect(404)).body.code).toBe('LECTURE_NOT_FOUND');
      expect((await learn('get', `/lectures/${videoId}`, carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      const video = (await learn('get', `/lectures/${videoId}`).expect(200)).body;
      expect(video).toEqual({
        id: videoId,
        title: 'Video 10 phút',
        description: 'Mô tả bài',
        lectureKind: 'video',
        durationSec: 600,
        mediaUrl: `https://fake.r2/video/${keys.video}?signed=1`,
        downloadUrl: null,
        manualComplete: false,
        resources: [{ id: resourceId, title: 'Slide', fileName: 'slide.pdf', sizeBytes: 2048 }],
        progress: { lastPositionSec: 0, watchedSec: 0, completed: false },
      });
      const pdf = (await learn('get', `/lectures/${pdfId}`).expect(200)).body;
      expect(pdf).toMatchObject({
        lectureKind: 'document',
        mediaUrl: `https://fake.r2/private/${keys.pdf}?signed=1`,
        downloadUrl: `https://fake.r2/private/${keys.pdf}?signed=1&download=bai-doc.pdf`,
        manualComplete: true,
        resources: [],
      });
      expect((await learn('get', `/lectures/${zeroId}`).expect(200)).body.manualComplete).toBe(true);
    },
    SLOW,
  );

  it(
    'tài liệu: link tải đúng tên; bài chưa xuất bản / id sai → 404; chưa ghi danh → 403',
    async () => {
      expect((await learn('get', `/resources/${resourceId}`).expect(200)).body).toEqual({
        url: `https://fake.r2/private/${keys.res}?signed=1&download=slide.pdf`,
      });
      for (const id of [hiddenResourceId, randomUUID(), 'abc']) {
        expect((await learn('get', `/resources/${id}`).expect(404)).body.code).toBe('RESOURCE_NOT_FOUND');
      }
      expect((await learn('get', `/resources/${resourceId}`, carol).expect(403)).body.code).toBe('NOT_ENROLLED');
    },
    SLOW,
  );

  it(
    'last-item: id sai định dạng → 400; bài ẩn → 404 (trước 403); ghi lastItemId + lastAccessedAt',
    async () => {
      await learn('put', '/last-item', stu, { itemId: 'abc' }).expect(400);
      expect((await learn('put', '/last-item', carol, { itemId: hiddenId }).expect(404)).body.code).toBe('ITEM_NOT_FOUND');
      expect((await learn('put', '/last-item', carol, { itemId: zeroId }).expect(403)).body.code).toBe('NOT_ENROLLED');
      await learn('put', '/last-item', stu, { itemId: zeroId }).expect(204);
      const e = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
      expect(e.lastItemId).toBe(zeroId);
      expect(e.lastAccessedAt).not.toBeNull();
      expect((await learn('get').expect(200)).body.resumeItemId).toBe(zeroId);
      // Trả lại trạng thái ban đầu cho test resume ở Task 5.
      await prisma.enrollment.update({ where: { id: enrollmentId }, data: { lastItemId: null } });
    },
    SLOW,
  );

  it(
    'tiến độ: PDF → 409; trần 2x; lọc ngoài khoảng/trùng; hoàn thành ở 90%; xem lại giữ mốc',
    async () => {
      const post = (body: object, item = videoId) => learn('post', `/lectures/${item}/progress`, stu, body);
      expect((await post({ positionSec: 0, buckets: [0] }, pdfId).expect(409)).body.code).toBe('PROGRESS_NOT_TRACKED');
      expect((await post({ positionSec: 0, buckets: [0] }, zeroId).expect(409)).body.code).toBe('PROGRESS_NOT_TRACKED');
      await post({ positionSec: 1, buckets: [-1] }).expect(400);
      expect((await learn('post', `/lectures/${videoId}/progress`, carol, { positionSec: 0, buckets: [] }).expect(403)).body.code)
        .toBe('NOT_ENROLLED');
      // Lần đầu: ân hạn 60s → trần ceil(60 × 2 / 10) = 12 đoạn; 60 nằm ngoài (600s = 60 đoạn); vị trí kẹp 600.
      const all = Array.from({ length: 60 }, (_, i) => i);
      expect((await post({ positionSec: 9999, buckets: [...all, 60, 3, 3] }).expect(200)).body).toEqual({
        completed: false,
        progressPct: 0,
      });
      expect(await progressRow()).toMatchObject({ watchedSec: 120, lastPositionSec: 600, completedAt: null });
      // Giả lập đã mở bài 10 phút → trần 132 đoạn.
      await prisma.$executeRaw`UPDATE item_progress SET "createdAt" = now() - interval '10 minutes'
        WHERE "enrollmentId" = ${enrollmentId}::uuid AND "itemId" = ${videoId}::uuid`;
      expect((await post({ positionSec: 300, buckets: all.slice(12, 53) }).expect(200)).body.completed).toBe(false); // 53 < 54
      expect((await post({ positionSec: 310, buckets: [53] }).expect(200)).body).toEqual({ completed: true, progressPct: 33.33 });
      const first = (await progressRow()).completedAt;
      expect(first).not.toBeNull();
      await post({ positionSec: 20, buckets: [54] }).expect(200);
      expect(await progressRow()).toMatchObject({ lastPositionSec: 20, watchedSec: 550, completedAt: first });
    },
    SLOW,
  );

  it(
    'tiến độ: quá 30 lần/phút → 429',
    async () => {
      await redis.set(`rl:learn-progress:${stu.id}`, 30, 'EX', 60);
      expect((await learn('post', `/lectures/${videoId}/progress`, stu, { positionSec: 1, buckets: [] }).expect(429)).body.code)
        .toBe('RATE_LIMITED');
      await redis.del(`rl:learn-progress:${stu.id}`);
    },
    SLOW,
  );

  it(
    'resume: chưa có lastItemId → bài đầu chưa xong (video đã xong → PDF)',
    async () => {
      const { body } = await learn('get').expect(200);
      expect(body.resumeItemId).toBe(pdfId);
      expect(body.sections[0].items[0].completed).toBe(true);
    },
    SLOW,
  );

  it(
    'hoàn thành tay: video có thời lượng → 409; PDF + video 0s → 200, gọi lại vẫn 200; xong hết → completedAt',
    async () => {
      expect((await learn('post', `/lectures/${videoId}/complete`).expect(409)).body.code).toBe('AUTO_COMPLETE_ONLY');
      expect((await learn('post', `/lectures/${pdfId}/complete`).expect(200)).body).toEqual({ completed: true, progressPct: 66.67 });
      await learn('post', `/lectures/${pdfId}/complete`).expect(200);
      expect((await learn('post', `/lectures/${zeroId}/complete`).expect(200)).body).toEqual({ completed: true, progressPct: 100 });
      expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } })).completedAt).not.toBeNull();
      expect((await learn('post', `/lectures/${pdfId}/complete`, carol).expect(403)).body.code).toBe('NOT_ENROLLED');
    },
    SLOW,
  );

  it(
    'ghi chú: thêm (trim, kẹp mốc, PDF = 0), xếp theo mốc, sửa, xoá; người khác → 404',
    async () => {
      const add = (item: string, b: object, user = stu) => learn('post', `/lectures/${item}/notes`, user, b);
      const n1 = (await add(videoId, { positionSec: 9999, body: '  cuối video  ' }).expect(201)).body;
      expect(n1).toMatchObject({ positionSec: 600, body: 'cuối video' });
      const n2 = (await add(videoId, { positionSec: 30, body: 'đầu video' }).expect(201)).body;
      expect((await add(pdfId, { positionSec: 50, body: 'pdf' }).expect(201)).body.positionSec).toBe(0);
      await add(videoId, { positionSec: 1, body: '   ' }).expect(400);
      await add(videoId, { positionSec: 1, body: 'x'.repeat(1001) }).expect(400);
      expect((await add(videoId, { positionSec: 1, body: 'a' }, carol).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await add(hiddenId, { positionSec: 1, body: 'a' }).expect(404)).body.code).toBe('LECTURE_NOT_FOUND');
      const list = (await learn('get', `/lectures/${videoId}/notes`).expect(200)).body as { id: string }[];
      expect(list.map((n) => n.id)).toEqual([n2.id, n1.id]);
      expect((await learn('patch', `/notes/${n2.id}`, stu, { body: ' đã sửa ' }).expect(200)).body.body).toBe('đã sửa');
      expect((await learn('patch', `/notes/${n2.id}`, carol, { body: 'x' }).expect(404)).body.code).toBe('NOTE_NOT_FOUND');
      await learn('patch', '/notes/abc', stu, { body: 'x' }).expect(404);
      await learn('delete', `/notes/${n2.id}`, carol).expect(404);
      await learn('delete', `/notes/${n2.id}`).expect(204);
      await learn('delete', `/notes/${n2.id}`).expect(404);
    },
    SLOW,
  );

  it(
    'ghi chú: tối đa 200 mỗi bài → 409 NOTE_LIMIT',
    async () => {
      const have = await prisma.note.count({ where: { enrollmentId, itemId: videoId } });
      await prisma.note.createMany({
        data: Array.from({ length: 200 - have }, (_, i) => ({ enrollmentId, itemId: videoId, positionSec: i, body: `n${i}` })),
      });
      expect((await learn('post', `/lectures/${videoId}/notes`, stu, { positionSec: 1, body: 'thừa' }).expect(409)).body.code)
        .toBe('NOTE_LIMIT');
    },
    SLOW,
  );
});
