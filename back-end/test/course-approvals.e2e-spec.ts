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
const BANK = { bankBin: '970436', bankAccountNo: '0123456789', bankAccountName: 'NGUYEN VAN A' };

type TestUser = { id: string; cookie: string };

describe('Định giá, gửi duyệt & duyệt khoá (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendCourseReviewed: vi.fn() };
  const emails: string[] = [];
  let admin: TestUser;
  let teacher: TestUser; // instructor, chưa cao cấp lúc đầu
  let other: TestUser; // instructor khác
  let student: TestUser;
  let ready: { courseId: string; assetId: string }; // khoá đủ checklist của teacher
  let otherAsset: string; // asset của khoá khác

  const call = (method: 'get' | 'post' | 'put' | 'patch', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  // Khoá đủ checklist gửi duyệt (course-checklist.ts): 5 bài video × 400s, mô tả 200 từ, đủ mục tiêu...
  const readyCourse = async (instructorId: string) => {
    const [category, topic] = await Promise.all([
      prisma.category.findFirstOrThrow({ where: { parentId: { not: null } }, select: { id: true } }),
      prisma.topic.findFirstOrThrow({ select: { id: true } }),
    ]);
    const asset = await prisma.asset.create({
      data: {
        ownerId: instructorId,
        kind: 'video',
        fileName: 'e2e.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 1n,
        storageKey: `e2e/${randomUUID()}.mp4`,
        status: 'ready',
        durationSec: 400,
      },
    });
    const course = await prisma.course.create({
      data: {
        instructorId,
        title: 'E2E ready',
        slug: `e2e-${randomUUID()}`,
        subtitle: 'Phụ đề',
        description: Array(200).fill('từ').join(' '),
        level: 'beginner',
        categoryId: category.id,
        thumbnailUrl: `${FakeStorage.PUBLIC}/t.jpg`,
        learningObjectives: ['a', 'b', 'c', 'd'],
        requirements: ['r'],
        targetAudience: ['t'],
        topics: { create: { topicId: topic.id, isPrimary: true } },
        sections: { create: { title: 'S1', position: 0 } },
      },
      include: { sections: true },
    });
    await prisma.curriculumItem.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        sectionId: course.sections[0].id,
        courseId: course.id,
        type: 'lecture' as const,
        title: `Bài ${i + 1}`,
        position: i,
        isPublished: true,
        lectureKind: 'video' as const,
        videoAssetId: asset.id,
        durationSec: 400,
      })),
    });
    return { courseId: course.id, assetId: asset.id };
  };

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
    [admin, teacher, other, student] = await Promise.all([
      makeUser('student,admin'),
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser(),
    ]);
    ready = await readyCourse(teacher.id);
    otherAsset = (await readyCourse(other.id)).assetId;
  }, 120_000);

  // Dọn: courses (cascade sections/items/approvals) → assets (owner Restrict) → users (cascade profiles).
  afterAll(async () => {
    const ids = [admin, teacher, other, student].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  describe('đặt giá', () => {
    it('chưa cao cấp: giá > 0 → 403 INSTRUCTOR_NOT_VERIFIED', async () => {
      const res = await call('put', `/api/instructor/courses/${ready.courseId}/price`, teacher.cookie)
        .send({ priceAmount: 199_000 })
        .expect(403);
      expect(res.body.code).toBe('INSTRUCTOR_NOT_VERIFIED');
    });

    it('giá ngoài bậc → 400 theo trường', async () => {
      const res = await call('put', `/api/instructor/courses/${ready.courseId}/price`, teacher.cookie)
        .send({ priceAmount: 123_000 })
        .expect(400);
      expect(res.body.errors[0].path).toEqual(['priceAmount']);
    });

    it('miễn phí luôn đặt được, detail có priceAmount', async () => {
      const res = await call('put', `/api/instructor/courses/${ready.courseId}/price`, teacher.cookie)
        .send({ priceAmount: 0 })
        .expect(200);
      expect(res.body).toMatchObject({ priceAmount: 0, publishedAt: null });
    });

    it('khoá của người khác → 404', () =>
      call('put', `/api/instructor/courses/${ready.courseId}/price`, other.cookie).send({ priceAmount: 0 }).expect(404));
  });

  describe('giảng viên cao cấp', () => {
    const body = { headline: 'Senior Backend', bank: BANK, agreeTerms: true };

    it('thiếu đồng ý điều khoản → 400', () =>
      call('post', '/api/instructor/premium', teacher.cookie).send({ ...body, agreeTerms: false }).expect(400));

    it('đăng ký → 201 verified + account', async () => {
      const res = await call('post', '/api/instructor/premium', teacher.cookie)
        .send({ ...body, socials: { github: 'https://github.com/e2e' } })
        .expect(201);
      expect(res.body).toEqual({ verified: true, account: BANK });
    });

    it('đăng ký lần 2 → 409 ALREADY_PREMIUM', async () => {
      const res = await call('post', '/api/instructor/premium', teacher.cookie).send(body).expect(409);
      expect(res.body.code).toBe('ALREADY_PREMIUM');
    });

    it('học viên → 403', () => call('post', '/api/instructor/premium', student.cookie).send(body).expect(403));

    it('sau khi cao cấp: đặt 199k được', async () => {
      const res = await call('put', `/api/instructor/courses/${ready.courseId}/price`, teacher.cookie)
        .send({ priceAmount: 199_000 })
        .expect(200);
      expect(res.body.priceAmount).toBe(199_000);
    });
  });

  describe('gửi duyệt', () => {
    const submit = (courseId: string, cookie: string, body: object = { copyrightConfirmed: true }) =>
      call('post', `/api/instructor/courses/${courseId}/submit`, cookie).send(body);

    it('chưa tick cam kết → 400', () => submit(ready.courseId, teacher.cookie, {}).expect(400));

    it('checklist thiếu → 400 CHECKLIST_INCOMPLETE kèm missing', async () => {
      const { body } = await call('post', '/api/instructor/courses', teacher.cookie).send({ title: 'Thiếu' }).expect(201);
      const res = await submit(body.id, teacher.cookie).expect(400);
      expect(res.body.code).toBe('CHECKLIST_INCOMPLETE');
      expect(res.body.missing.length).toBeGreaterThan(0);
    });

    it('đủ điều kiện → in_review, có approval pending', async () => {
      const res = await submit(ready.courseId, teacher.cookie, { copyrightConfirmed: true, note: 'Video tự quay' }).expect(200);
      expect(res.body.status).toBe('in_review');
      expect(res.body.lastReview).toMatchObject({ status: 'pending', reason: null });
      const approval = await prisma.courseApproval.findFirstOrThrow({ where: { courseId: ready.courseId } });
      expect(approval.copyrightNote).toBe('Video tự quay');
    });

    it('gửi lần 2 → 409 COURSE_LOCKED; PATCH → 409', async () => {
      expect((await submit(ready.courseId, teacher.cookie).expect(409)).body.code).toBe('COURSE_LOCKED');
      await call('patch', `/api/instructor/courses/${ready.courseId}`, teacher.cookie).send({ title: 'X' }).expect(409);
    });
  });

  describe('admin xem hàng đợi', () => {
    let approvalId: string;
    beforeAll(async () => {
      approvalId = (await prisma.courseApproval.findFirstOrThrow({ where: { courseId: ready.courseId } })).id;
    });

    it('giảng viên gọi API admin → 403', () => call('get', '/api/admin/course-approvals', teacher.cookie).expect(403));

    it('list pending trả dạng phân trang', async () => {
      const res = await call('get', '/api/admin/course-approvals?status=pending', admin.cookie).expect(200);
      expect(res.body).toMatchObject({ page: 1, pageSize: 20 });
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('detail có khoá, khung chương trình, lịch sử', async () => {
      const res = await call('get', `/api/admin/course-approvals/${approvalId}`, admin.cookie).expect(200);
      expect(res.body.approval).toMatchObject({ id: approvalId, status: 'pending', copyrightNote: 'Video tự quay' });
      expect(res.body.course).toMatchObject({ id: ready.courseId, status: 'in_review', priceAmount: 199_000 });
      expect(res.body.sections[0].items).toHaveLength(5);
      expect(res.body.history).toEqual([]);
    });

    it('URL asset của khoá → 200; asset khoá khác → 404', async () => {
      const ok = await call('get', `/api/admin/course-approvals/${approvalId}/assets/${ready.assetId}/url`, admin.cookie).expect(200);
      expect(ok.body.url).toContain('signed=1');
      await call('get', `/api/admin/course-approvals/${approvalId}/assets/${otherAsset}/url`, admin.cookie).expect(404);
    });

    it('id sai dạng → 404', () => call('get', '/api/admin/course-approvals/abc', admin.cookie).expect(404));
  });

  describe('admin duyệt / từ chối', () => {
    const approvalOf = async () =>
      (await prisma.courseApproval.findFirstOrThrow({ where: { courseId: ready.courseId }, orderBy: { createdAt: 'desc' } })).id;

    it('từ chối thiếu lý do → 400', async () =>
      call('post', `/api/admin/course-approvals/${await approvalOf()}/reject`, admin.cookie).send({ reason: ' ' }).expect(400));

    it('từ chối → khoá về draft, giảng viên thấy lý do, có gửi mail', async () => {
      const id = await approvalOf();
      const res = await call('post', `/api/admin/course-approvals/${id}/reject`, admin.cookie)
        .send({ reason: 'Âm thanh bài 2 bị rè' })
        .expect(200);
      expect(res.body.approval).toMatchObject({ status: 'rejected', reason: 'Âm thanh bài 2 bị rè' });
      const course = await call('get', `/api/instructor/courses/${ready.courseId}`, teacher.cookie).expect(200);
      expect(course.body).toMatchObject({ status: 'draft', lastReview: { status: 'rejected', reason: 'Âm thanh bài 2 bị rè' } });
      expect(mail.sendCourseReviewed).toHaveBeenCalledWith(expect.any(String), 'E2E ready', false, 'Âm thanh bài 2 bị rè');
    });

    it('xử lý lại approval đã từ chối → 409 ALREADY_REVIEWED', async () => {
      const res = await call('post', `/api/admin/course-approvals/${await approvalOf()}/approve`, admin.cookie).expect(409);
      expect(res.body.code).toBe('ALREADY_REVIEWED');
    });

    it('gửi lại → duyệt → published, có publishedAt; giá bị khoá', async () => {
      await call('post', `/api/instructor/courses/${ready.courseId}/submit`, teacher.cookie)
        .send({ copyrightConfirmed: true })
        .expect(200);
      const id = await approvalOf();
      const res = await call('post', `/api/admin/course-approvals/${id}/approve`, admin.cookie).expect(200);
      expect(res.body.course.status).toBe('published');
      expect(res.body.course.publishedAt).not.toBeNull();
      expect(res.body.history).toHaveLength(1);
      const price = await call('put', `/api/instructor/courses/${ready.courseId}/price`, teacher.cookie)
        .send({ priceAmount: 299_000 })
        .expect(409);
      expect(price.body.code).toBe('PRICE_LOCKED');
    });
  });
});
