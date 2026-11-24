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
type Method = 'get' | 'post' | 'put' | 'delete';
type Tree = { sections: { id: string; items: { id: string }[] }[] };

describe('Đánh giá khoá học (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // giảng viên, chủ khoá
  let stu: TestUser; // học viên sẽ học 50%
  let carol: TestUser; // học viên chưa học bài nào
  let dave: TestUser; // chưa ghi danh
  let courseId: string;
  let slug: string;
  let a: string; // khoá có 2 bài → tiến độ chỉ nhận 0 / 50 / 100
  let b: string;

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
  const learn = (method: Method, path: string, user: TestUser, body?: object) =>
    call(method, `/api/learn/${slug}${path}`, user.cookie, body);
  const list = (query = '') => call('get', `/api/courses/${slug}/reviews${query}`);
  const courseRating = async () => {
    const c = await prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { ratingAvg: true, ratingCount: true } });
    return { avg: Number(c.ratingAvg), count: c.ratingCount };
  };

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
    [alice, stu, carol, dave] = await Promise.all([makeUser('Alice'), makeUser('Minh Anh'), makeUser('Carol'), makeUser('Dave')]);
    courseId = (await call('post', '/api/instructor/courses', alice.cookie, { title: 'Khoá e2e đánh giá' }).expect(201)).body
      .id as string;
    const as = (path: string, body: object) => call('post', `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    const sectionId = ((await as('/sections', { title: 'Phần 1' }).expect(201)).body as Tree).sections[0].id;
    const add = async (title: string) =>
      ((await as(`/sections/${sectionId}/items`, { type: 'lecture', title }).expect(201)).body as Tree).sections[0].items.at(-1)!.id;
    a = await add('Bài 1');
    b = await add('Bài 2');
    // Gắn nội dung thẳng bằng Prisma (bỏ qua luồng upload) — thoả ràng buộc nội dung của item.
    for (const id of [a, b]) {
      const asset = await prisma.asset.create({
        data: {
          ownerId: alice.id,
          kind: 'document',
          fileName: 'bai-doc.pdf',
          mimeType: 'application/pdf',
          sizeBytes: BigInt(1024),
          storageKey: `e2e/${randomUUID()}.pdf`,
          status: 'ready',
        },
      });
      await prisma.curriculumItem.update({ where: { id }, data: { lectureKind: 'document', documentAssetId: asset.id, isPublished: true } });
    }
    slug = (await prisma.course.update({ where: { id: courseId }, data: { status: 'published' }, select: { slug: true } })).slug;
    await prisma.enrollment.createMany({ data: [{ userId: stu.id, courseId }, { userId: carol.id, courseId }] });
  }, SLOW);

  // course cascade → item/enrollment/progress/review; asset Restrict theo owner → xoá trước user.
  afterAll(async () => {
    const ids = [alice, stu, carol, dave].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it(
    'chưa ai đánh giá → danh sách rỗng, phân bố đủ 5 mức',
    async () => {
      const res = await list().expect(200);
      expect(res.body).toEqual({ items: [], nextCursor: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      expect(res.headers['cache-control']).toBe('no-store');
    },
    SLOW,
  );

  it(
    'kiểm quyền: chưa đăng nhập 401, slug sai 404, chủ khoá 403, chưa ghi danh 403',
    async () => {
      await call('get', `/api/learn/${slug}/review`).expect(401);
      await call('get', '/api/learn/khong-co-khoa-nay/review', stu.cookie).expect(404);
      expect((await learn('get', '/review', alice).expect(403)).body.code).toBe('REVIEW_OWN_COURSE');
      expect((await learn('put', '/review', alice, { rating: 5 }).expect(403)).body.code).toBe('REVIEW_OWN_COURSE');
      expect((await learn('get', '/review', dave).expect(403)).body.code).toBe('NOT_ENROLLED');
      expect((await learn('put', '/review', dave, { rating: 5 }).expect(403)).body.code).toBe('NOT_ENROLLED');
    },
    SLOW,
  );

  it(
    'dưới 50% → chưa được tạo',
    async () => {
      expect((await learn('get', '/review', carol).expect(200)).body).toEqual({
        review: null,
        progressPct: 0,
        minProgressPct: 50,
        canReview: false,
      });
      const res = await learn('put', '/review', carol, { rating: 5 }).expect(403);
      expect(res.body).toMatchObject({ code: 'REVIEW_PROGRESS_REQUIRED', progressPct: 0, minProgressPct: 50 });
      expect(await courseRating()).toEqual({ avg: 0, count: 0 });
    },
    SLOW,
  );

  it(
    'đủ 50% → tạo được, điểm khoá cập nhật',
    async () => {
      await learn('post', `/lectures/${a}/complete`, stu).expect(200);
      expect((await learn('get', '/review', stu).expect(200)).body).toMatchObject({ review: null, progressPct: 50, canReview: true });
      const res = await learn('put', '/review', stu, { rating: 4, comment: '  Dễ hiểu  ' }).expect(200);
      expect(res.body).toMatchObject({ rating: 4, comment: 'Dễ hiểu' });
      expect(await courseRating()).toEqual({ avg: 4, count: 1 });
      const { body } = await list().expect(200);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({ rating: 4, comment: 'Dễ hiểu', author: { name: 'Minh Anh' } });
      expect(body.items[0].author.id).toEqual(expect.any(String));
      expect(body.items[0]).not.toHaveProperty('instructorReply');
      expect(body.items[0]).not.toHaveProperty('userId');
      expect(body.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 });
    },
    SLOW,
  );

  it(
    'dữ liệu sai → 400',
    async () => {
      await learn('put', '/review', stu, { rating: 6 }).expect(400);
      await learn('put', '/review', stu, { rating: 3, comment: 'a'.repeat(1001) }).expect(400);
      await list('?rating=9').expect(400);
      expect(await courseRating()).toEqual({ avg: 4, count: 1 });
    },
    SLOW,
  );

  it(
    'tiến độ tụt dưới 50% vẫn sửa được; sửa không sinh dòng mới, giữ createdAt',
    async () => {
      const before = (await learn('get', '/review', stu).expect(200)).body.review as { createdAt: string };
      await learn('delete', `/lectures/${a}/complete`, stu).expect(200);
      const res = await learn('put', '/review', stu, { rating: 2, comment: '' }).expect(200);
      expect(res.body).toMatchObject({ rating: 2, comment: null, createdAt: before.createdAt });
      expect((await learn('get', '/review', stu).expect(200)).body).toMatchObject({ progressPct: 0, canReview: true });
      expect(await courseRating()).toEqual({ avg: 2, count: 1 });
    },
    SLOW,
  );

  it(
    'điểm trung bình lẻ, lọc theo sao, phân trang',
    async () => {
      // Thêm 11 đánh giá 5★ thẳng bằng Prisma rồi để carol đánh giá qua API cho điểm khoá được tính lại.
      const extras = await Promise.all(Array.from({ length: 11 }, (_, i) => makeUser(`Extra ${i}`)));
      await prisma.courseReview.createMany({ data: extras.map((u) => ({ courseId, userId: u.id, rating: 5 })) });
      await prisma.enrollment.updateMany({ where: { userId: carol.id, courseId }, data: { progressPct: 50 } });
      await learn('put', '/review', carol, { rating: 4 }).expect(200);
      // 2 + 4 + 11×5 = 61 trên 13 lượt = 4.69
      expect(await courseRating()).toEqual({ avg: 4.69, count: 13 });

      const page1 = (await list().expect(200)).body;
      expect(page1.items).toHaveLength(10);
      expect(page1.nextCursor).toBe(page1.items[9].id);
      const page2 = (await list(`?cursor=${page1.nextCursor}`).expect(200)).body;
      expect(page2.items).toHaveLength(3);
      expect(page2.nextCursor).toBeNull();
      const ids = [...page1.items, ...page2.items].map((r: { id: string }) => r.id);
      expect(new Set(ids).size).toBe(13);

      const only2 = (await list('?rating=2').expect(200)).body;
      expect(only2.items).toHaveLength(1);
      // Lọc không đổi phân bố.
      expect(only2.distribution).toEqual({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 11 });
      await prisma.user.deleteMany({ where: { id: { in: extras.map((u) => u.id) } } });
    },
    SLOW,
  );

  it(
    'xoá → điểm khoá tính lại; xoá lần nữa vẫn 204',
    async () => {
      // Sau khi dọn 11 tài khoản phụ còn 2 đánh giá: stu 2★, carol 4★.
      await learn('delete', '/review', stu).expect(204);
      expect(await courseRating()).toEqual({ avg: 4, count: 1 });
      await learn('delete', '/review', stu).expect(204);
      await learn('delete', '/review', carol).expect(204);
      expect(await courseRating()).toEqual({ avg: 0, count: 0 });
      expect((await learn('get', '/review', stu).expect(200)).body.review).toBeNull();
    },
    SLOW,
  );

  it(
    'khoá gỡ xuất bản → danh sách công khai 404, học viên vẫn xem được đánh giá của mình',
    async () => {
      await prisma.course.update({ where: { id: courseId }, data: { status: 'unpublished' } });
      expect((await list().expect(404)).body.code).toBe('COURSE_NOT_FOUND');
      await learn('get', '/review', stu).expect(200);
    },
    SLOW,
  );
});
