// back-end/test/catalog.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { CourseStatus, Prisma } from '@prisma/client';
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
// Token chữ thường không dấu, nằm trong title mọi khoá test → lọc bằng q để không lẫn khoá có sẵn trong DB.
const TOKEN = `zq${randomUUID().slice(0, 8)}`;

describe('Catalog công khai (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let teacher: { id: string };
  let student: { id: string };
  let cat: { parentSlug: string; childSlug: string; childId: string };
  let topic: { id: string; slug: string; name: string };
  let assetId: string;

  const get = (path: string) =>
    request(app.getHttpServer()).get(path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
  const makeUser = async (role: string, name = 'E2E') => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', randomIp())
      .send({ name, email, password: PASSWORD })
      .expect(200);
    const u = await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    return { id: u.id };
  };
  // Tạo khoá trực tiếp bằng Prisma (bỏ qua flow duyệt). items: danh sách bài (mặc định 2 bài video 300s đã xuất bản).
  const makeCourse = async (opts: {
    title: string;
    status?: CourseStatus;
    priceAmount?: number;
    categoryId?: string;
    enrollmentCount?: number;
    publishedAt?: Date;
    items?: Partial<Prisma.CurriculumItemCreateManyInput>[];
  }) => {
    const course = await prisma.course.create({
      data: {
        instructorId: teacher.id,
        title: opts.title,
        slug: `e2e-${randomUUID()}`,
        subtitle: 'Phụ đề',
        level: 'beginner',
        status: opts.status ?? 'published',
        publishedAt: opts.status && opts.status !== 'published' ? null : (opts.publishedAt ?? new Date()),
        priceAmount: opts.priceAmount ?? 0,
        categoryId: opts.categoryId ?? cat.childId,
        enrollmentCount: opts.enrollmentCount ?? 0,
        thumbnailUrl: `${FakeStorage.PUBLIC}/t.jpg`,
        learningObjectives: ['a', 'b', 'c', 'd'],
        requirements: ['r'],
        targetAudience: ['t'],
        topics: { create: { topicId: topic.id, isPrimary: true } },
        sections: { create: { title: 'S1', position: 0 } },
      },
      include: { sections: true },
    });
    const items = opts.items ?? [{}, {}];
    await prisma.curriculumItem.createMany({
      data: items.map((it, i) => ({
        sectionId: course.sections[0].id,
        courseId: course.id,
        type: 'lecture' as const,
        title: `Bài ${i + 1}`,
        position: i,
        isPublished: true,
        lectureKind: 'video' as const,
        videoAssetId: assetId,
        durationSec: 300,
        ...it,
      })),
    });
    return course;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendCourseReviewed: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [teacher, student] = await Promise.all([makeUser('student,instructor', 'Giảng Viên E2E'), makeUser('student')]);
    const child = await prisma.category.findFirstOrThrow({
      where: { parentId: { not: null } },
      select: { id: true, slug: true, parent: { select: { slug: true } } },
    });
    cat = { parentSlug: child.parent!.slug, childSlug: child.slug, childId: child.id };
    topic = await prisma.topic.findFirstOrThrow({ select: { id: true, slug: true, name: true } });
    assetId = (
      await prisma.asset.create({
        data: {
          ownerId: teacher.id,
          kind: 'video',
          fileName: 'e2e.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1n,
          storageKey: `e2e/${randomUUID()}.mp4`,
          status: 'ready',
          durationSec: 300,
        },
      })
    ).id;
  }, 120_000);

  afterAll(async () => {
    const ids = [teacher, student].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  describe('GET /api/courses', () => {
    it('chỉ trả khoá published; đếm bài & thời lượng chỉ tính item đã xuất bản', async () => {
      const pub = await makeCourse({
        title: `Published ${TOKEN}`,
        items: [{}, {}, { isPublished: false, durationSec: 999 }],
      });
      await makeCourse({ title: `Draft ${TOKEN}`, status: 'draft' });
      await makeCourse({ title: `Review ${TOKEN}`, status: 'in_review' });
      await makeCourse({ title: `Gỡ ${TOKEN}`, status: 'unpublished' });

      const res = await get(`/api/courses?q=${TOKEN}`).expect(200);
      expect(res.body.items.map((c: { id: string }) => c.id)).toEqual([pub.id]);
      expect(res.body.total).toBe(1);
      const card = res.body.items[0];
      expect(card).toMatchObject({
        slug: pub.slug,
        lectureCount: 2,
        totalDurationSec: 600,
        ratingAvg: 0,
        instructor: { id: teacher.id, name: 'Giảng Viên E2E' },
      });
      expect(card).not.toHaveProperty('description');
      expect(res.headers['cache-control']).toBe('public, max-age=60');
    });

    it('category cấp 1 trả cả khoá thuộc category con', async () => {
      const c = await makeCourse({ title: `Cat ${TOKEN}` });
      const byParent = await get(`/api/courses?q=${TOKEN}&category=${cat.parentSlug}`).expect(200);
      expect(byParent.body.items.map((x: { id: string }) => x.id)).toContain(c.id);
      const byChild = await get(`/api/courses?q=${TOKEN}&category=${cat.childSlug}`).expect(200);
      expect(byChild.body.items.map((x: { id: string }) => x.id)).toContain(c.id);
    });

    it('category / topic không tồn tại → rỗng, không 404', async () => {
      const a = await get(`/api/courses?category=khong-ton-tai-${TOKEN}`).expect(200);
      expect(a.body).toMatchObject({ items: [], total: 0, topic: null });
      const b = await get(`/api/courses?topic=khong-ton-tai-${TOKEN}`).expect(200);
      expect(b.body).toMatchObject({ items: [], total: 0, topic: null });
    });

    it('lọc topic trả kèm { slug, name } của topic', async () => {
      const res = await get(`/api/courses?q=${TOKEN}&topic=${topic.slug}`).expect(200);
      expect(res.body.topic).toEqual({ slug: topic.slug, name: topic.name });
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('price=free / paid và sort giá', async () => {
      const paid = await makeCourse({ title: `Paid ${TOKEN}`, priceAmount: 199_000 });
      const freeCourse = await makeCourse({ title: `Free ${TOKEN}`, priceAmount: 0 });
      const free = await get(`/api/courses?q=${TOKEN}&price=free`).expect(200);
      expect(free.body.items.map((c: { id: string }) => c.id)).toContain(freeCourse.id);
      expect(free.body.items.map((c: { id: string }) => c.id)).not.toContain(paid.id);
      expect(free.body.items.every((c: { priceAmount: number }) => c.priceAmount === 0)).toBe(true);
      const paidRes = await get(`/api/courses?q=${TOKEN}&price=paid`).expect(200);
      expect(paidRes.body.items.map((c: { id: string }) => c.id)).toEqual([paid.id]);
      const desc = await get(`/api/courses?q=${TOKEN}&sort=price_desc`).expect(200);
      expect(desc.body.items[0].id).toBe(paid.id);
    });

    it('sort=popular theo enrollmentCount giảm dần', async () => {
      const hot = await makeCourse({ title: `Hot ${TOKEN}`, enrollmentCount: 50 });
      const res = await get(`/api/courses?q=${TOKEN}&sort=popular`).expect(200);
      expect(res.body.items[0].id).toBe(hot.id);
    });

    it('phân trang: total đúng, limit giới hạn số item', async () => {
      const all = await get(`/api/courses?q=${TOKEN}`).expect(200);
      const p2 = await get(`/api/courses?q=${TOKEN}&limit=1&page=2`).expect(200);
      expect(p2.body).toMatchObject({ total: all.body.total, page: 2, limit: 1 });
      expect(p2.body.items).toHaveLength(1);
      expect(p2.body.items[0].id).toBe(all.body.items[1].id);
    });

    it('query sai → 400', async () => {
      await get('/api/courses?limit=51').expect(400);
      await get('/api/courses?sort=abc').expect(400);
      await get('/api/courses?level=expert').expect(400);
    });

    it('q không dấu khớp title có dấu; khớp cả subtitle', async () => {
      const vn = await makeCourse({ title: `Lập trình Python ${TOKEN}` });
      const res = await get(`/api/courses?q=${encodeURIComponent(`lap trinh python ${TOKEN}`)}`).expect(200);
      expect(res.body.items.map((c: { id: string }) => c.id)).toEqual([vn.id]);

      const sub = await makeCourse({ title: `Khác ${TOKEN}` });
      await prisma.course.update({ where: { id: sub.id }, data: { subtitle: `Học Đồ hoạ ${TOKEN}sub` } });
      const res2 = await get(`/api/courses?q=${encodeURIComponent(`do hoa ${TOKEN}sub`)}`).expect(200);
      expect(res2.body.items.map((c: { id: string }) => c.id)).toEqual([sub.id]);
    });

    it('ký tự % và _ trong q là chữ thường, không phải wildcard', async () => {
      const c = await makeCourse({ title: `Lit ${TOKEN}x` });
      const q = (s: string) => get(`/api/courses?q=${encodeURIComponent(s)}`).expect(200);
      expect((await q(`${TOKEN}%`)).body.total).toBe(0);
      expect((await q(`${TOKEN}_`)).body.total).toBe(0); // "_" khớp 1 ký tự nếu là wildcard → sẽ khớp "...x"
      expect((await q(`${TOKEN}x`)).body.items.map((i: { id: string }) => i.id)).toContain(c.id);
    });

    it('lỗi 400 không mang Cache-Control public', async () => {
      const res = await get('/api/courses?limit=51').expect(400);
      expect(res.headers['cache-control'] ?? '').not.toMatch(/public/);
    });
  });
  describe('GET /api/courses/:slug (+ /curriculum)', () => {
    it('khoá published → đủ trường chi tiết, có category cha & topic', async () => {
      const c = await makeCourse({ title: `Detail ${TOKEN}` });
      const res = await get(`/api/courses/${c.slug}`).expect(200);
      expect(res.body).toMatchObject({
        id: c.id,
        learningObjectives: ['a', 'b', 'c', 'd'],
        lectureCount: 2,
        category: { slug: cat.childSlug, parent: { slug: cat.parentSlug } },
        topics: [{ slug: topic.slug, name: topic.name }],
        instructor: { id: teacher.id, name: 'Giảng Viên E2E', headline: null },
      });
      expect(res.body.instructor).not.toHaveProperty('email');
    });

    it('khoá draft / slug lạ → 404 COURSE_NOT_FOUND', async () => {
      const d = await makeCourse({ title: `D ${TOKEN}`, status: 'draft' });
      const r1 = await get(`/api/courses/${d.slug}`).expect(404);
      expect(r1.body.code).toBe('COURSE_NOT_FOUND');
      await get(`/api/courses/khong-co-${TOKEN}`).expect(404);
      const r2 = await get(`/api/courses/${d.slug}/curriculum`).expect(404);
      expect(r2.headers['cache-control'] ?? '').not.toMatch(/public/);
      expect(r1.headers['cache-control'] ?? '').not.toMatch(/public/);
    });

    it('curriculum: isPreview chỉ true khi xem thử được ngay (video + asset ready)', async () => {
      const pending = await prisma.asset.create({
        data: { ownerId: teacher.id, kind: 'video', fileName: 'p.mp4', mimeType: 'video/mp4', sizeBytes: 1n, storageKey: `e2e/${randomUUID()}.mp4`, status: 'processing' },
      });
      const pdf = await prisma.asset.create({
        data: { ownerId: teacher.id, kind: 'document', fileName: 'd.pdf', mimeType: 'application/pdf', sizeBytes: 1n, storageKey: `e2e/${randomUUID()}.pdf`, status: 'ready' },
      });
      const c = await makeCourse({
        title: `CurPv ${TOKEN}`,
        items: [
          { title: 'ok', isPreview: true },
          { title: 'pdf', isPreview: true, lectureKind: 'document', videoAssetId: null, documentAssetId: pdf.id },
          { title: 'chưa ready', isPreview: true, videoAssetId: pending.id },
        ],
      });
      const res = await get(`/api/courses/${c.slug}/curriculum`).expect(200);
      const flags = Object.fromEntries(res.body.sections[0].items.map((i: { title: string; isPreview: boolean }) => [i.title, i.isPreview]));
      expect(flags).toEqual({ ok: true, pdf: false, 'chưa ready': false });
      expect(JSON.stringify(res.body)).not.toMatch(/lectureKind|videoAsset|status/);
    });

    it('curriculum: chỉ item đã xuất bản, bỏ section rỗng, không lộ asset', async () => {
      const c = await makeCourse({
        title: `Cur ${TOKEN}`,
        items: [{ isPreview: true }, { isPublished: false, title: 'Ẩn' }],
      });
      await prisma.section.create({ data: { courseId: c.id, title: 'Rỗng', position: 1 } });
      const res = await get(`/api/courses/${c.slug}/curriculum`).expect(200);
      expect(res.body.sections).toHaveLength(1);
      expect(res.body.sections[0].items).toEqual([
        { id: expect.any(String), type: 'lecture', title: 'Bài 1', durationSec: 300, isPreview: true },
      ]);
      expect(JSON.stringify(res.body)).not.toMatch(/storageKey|videoAssetId|fake\.r2/);
    });
  });
  describe('GET /api/courses/:slug/preview/:itemId', () => {
    let course: { id: string; slug: string };
    let previewId: string;
    let normalId: string;

    beforeAll(async () => {
      course = await makeCourse({ title: `Pv ${TOKEN}`, items: [{ isPreview: true }, {}] });
      const items = await prisma.curriculumItem.findMany({ where: { courseId: course.id }, orderBy: { position: 'asc' } });
      [previewId, normalId] = items.map((i) => i.id);
    });

    it('item preview → 200 { url } presigned, no-store', async () => {
      const res = await get(`/api/courses/${course.slug}/preview/${previewId}`).expect(200);
      expect(res.body.url).toMatch(/^https:\/\/fake\.r2\/video\/.+\?signed=1$/);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('item thường → 403 PREVIEW_NOT_ALLOWED', async () => {
      const res = await get(`/api/courses/${course.slug}/preview/${normalId}`).expect(403);
      expect(res.body.code).toBe('PREVIEW_NOT_ALLOWED');
    });

    it('item của khoá khác / id sai định dạng → 404 ITEM_NOT_FOUND', async () => {
      const other = await makeCourse({ title: `Pv2 ${TOKEN}` });
      const res = await get(`/api/courses/${other.slug}/preview/${previewId}`).expect(404);
      expect(res.body.code).toBe('ITEM_NOT_FOUND');
      await get(`/api/courses/${course.slug}/preview/abc`).expect(404);
    });
  });
  // Trang cá nhân /u/:id (module profiles) — đặt ở đây để dùng chung teacher / makeCourse.
  describe('GET /api/users/:id + /api/me/profile', () => {
    type Me = { id: string; cookie: string };
    const signIn = async (): Promise<Me> => {
      const email = `e2e-${randomUUID()}@example.com`;
      emails.push(email);
      const post = (path: string) =>
        request(app.getHttpServer()).post(path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
      await post('/api/auth/sign-up/email').send({ name: 'Học Viên Hồ Sơ', email, password: PASSWORD }).expect(200);
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
      const res = await post('/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
      const cookie = (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
      return { id: res.body.user.id as string, cookie };
    };
    const patch = (me: Me, body: object) =>
      request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Origin', FE_URL)
        .set('X-Forwarded-For', randomIp())
        .set('Cookie', me.cookie)
        .send(body);

    it('giảng viên: khoá published, headline của instructor_profiles, không lộ ngân hàng/email', async () => {
      await prisma.instructorProfile.upsert({
        where: { userId: teacher.id },
        create: {
          userId: teacher.id,
          headline: 'Kỹ sư phần mềm',
          bio: 'Bio',
          bankBin: '970436',
          bankAccountNo: '0123456789',
          bankAccountName: 'NGUYEN VAN A',
        },
        update: {},
      });
      const pub = await makeCourse({ title: `Ins ${TOKEN}`, enrollmentCount: 7 });
      await makeCourse({ title: `InsDraft ${TOKEN}`, status: 'draft' });
      const res = await get(`/api/users/${teacher.id}`).expect(200);
      expect(res.headers['cache-control']).toBe('public, max-age=60');
      expect(res.body).toMatchObject({
        id: teacher.id, name: 'Giảng Viên E2E', headline: 'Kỹ sư phần mềm', isInstructor: true, verified: true,
        coverTone: 'ink', learningPublic: false, learning: null,
      });
      const ids = res.body.teaching.courses.map((c: { id: string }) => c.id);
      expect(ids).toContain(pub.id);
      expect(res.body.teaching.courses.every((c: { title: string }) => !c.title.startsWith('InsDraft'))).toBe(true);
      expect(res.body.teaching.studentCount).toBeGreaterThanOrEqual(7);
      expect(JSON.stringify(res.body)).not.toMatch(/bankBin|bankAccount|0123456789|email|role|banned/);
    });

    it('học viên: có trang, mặc định ẩn phần học tập', async () => {
      const res = await get(`/api/users/${student.id}`).expect(200);
      expect(res.body).toMatchObject({
        id: student.id, isInstructor: false, verified: false, teaching: null, learningPublic: false, learning: null,
        headline: null, bio: null,
      });
    });

    it('tự bật role instructor nhưng chưa có khoá, chưa xác minh → vẫn là học viên', async () => {
      const wannabe = await makeUser('student,instructor');
      const res = await get(`/api/users/${wannabe.id}`).expect(200);
      expect(res.body).toMatchObject({ isInstructor: false, verified: false, teaching: null });
    });

    it('id sai / tài khoản nghiệp vụ / bị khoá → 404 USER_NOT_FOUND', async () => {
      const r = await get('/api/users/abc').expect(404);
      expect(r.body.code).toBe('USER_NOT_FOUND');
      await get(`/api/users/${randomUUID()}`).expect(404);
      const staff = await makeUser('admin');
      await get(`/api/users/${staff.id}`).expect(404);
      const banned = await makeUser('student');
      await prisma.user.update({ where: { id: banned.id }, data: { banned: true } });
      await get(`/api/users/${banned.id}`).expect(404);
    });

    it('PATCH cần đăng nhập, kiểm dữ liệu; bật công khai thì hiện khoá published + chứng chỉ còn hiệu lực', async () => {
      await request(app.getHttpServer()).patch('/api/me/profile').set('Origin', FE_URL).send({ learningPublic: true }).expect(401);
      const me = await signIn();
      await patch(me, { bio: 'ghé https://spam.example' }).expect(400);
      await patch(me, { coverTone: 'rainbow' }).expect(400);

      const [done, doing, hidden] = await Promise.all([
        makeCourse({ title: `Done ${TOKEN}` }),
        makeCourse({ title: `Doing ${TOKEN}` }),
        makeCourse({ title: `Hidden ${TOKEN}`, status: 'draft' }),
      ]);
      await prisma.enrollment.createMany({
        data: [
          { userId: me.id, courseId: done.id, progressPct: 100, completedAt: new Date() },
          { userId: me.id, courseId: doing.id, progressPct: 40.4 },
          { userId: me.id, courseId: hidden.id, progressPct: 10 },
        ],
      });
      await prisma.certificate.createMany({
        data: [
          { userId: me.id, courseId: done.id, serialNo: `E2E${randomUUID().slice(0, 7)}` },
          { userId: me.id, courseId: doing.id, serialNo: `E2E${randomUUID().slice(0, 7)}`, revokedAt: new Date() },
        ],
      });

      // Chưa bật: server không trả gì về học tập.
      const before = await get(`/api/users/${me.id}`).expect(200);
      expect(before.body.learning).toBeNull();
      expect(JSON.stringify(before.body)).not.toContain(TOKEN);

      const saved = await patch(me, { headline: '  Sinh viên CNTT ', bio: '', coverTone: 'violet', learningPublic: true }).expect(200);
      expect(saved.body).toEqual({
        headline: 'Sinh viên CNTT', bio: null, coverTone: 'violet', learningPublic: true, hasInstructorProfile: false,
      });

      const { body } = await get(`/api/users/${me.id}`).expect(200);
      expect(body).toMatchObject({ headline: 'Sinh viên CNTT', coverTone: 'violet', learningPublic: true, teaching: null });
      expect(body.learning.completed.map((c: { slug: string }) => c.slug)).toEqual([done.slug]);
      expect(body.learning.inProgress).toEqual([
        { slug: doing.slug, title: doing.title, thumbnailUrl: doing.thumbnailUrl, instructorName: 'Giảng Viên E2E', progressPct: 40 },
      ]);
      expect(body.learning.certificates.map((c: { courseSlug: string }) => c.courseSlug)).toEqual([done.slug]);
      expect(body.learning.skills).toEqual([]);

      // Tắt lại → ẩn ngay ở API.
      await patch(me, { learningPublic: false }).expect(200);
      expect((await get(`/api/users/${me.id}`).expect(200)).body.learning).toBeNull();
    });
  });
});
