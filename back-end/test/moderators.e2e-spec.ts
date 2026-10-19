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
const NEW_PASSWORD = 'Moderator456!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const randomEmail = () => `e2e-${randomUUID()}@example.com`;

type TestUser = { id: string; cookie: string };
type Root = { id: string; childId: string };

describe('Moderator & hàng đợi duyệt theo danh mục (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mail = {
    sendVerification: vi.fn(),
    sendResetPassword: vi.fn(),
    sendCourseReviewed: vi.fn(),
    sendStaffInvite: vi.fn(),
  };
  const emails: string[] = [];
  let admin: TestUser;
  let teacher: TestUser;
  let student: TestUser;
  let rootA: Root;
  let rootB: Root;
  let approvalA: string; // khoá thuộc danh mục A
  let approvalB: string; // khoá thuộc danh mục B
  const modEmail = randomEmail();
  let modId: string;
  let mod: string; // cookie moderator

  const call = (method: 'get' | 'post' | 'put', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const signIn = (email: string, password: string) =>
    call('post', '/api/auth/sign-in/email').send({ email, password });
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = randomEmail();
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await signIn(email, PASSWORD).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const inviteUrl = async (email: string, times = 1) => {
    await vi.waitFor(() =>
      expect(mail.sendStaffInvite.mock.calls.filter(([to]) => to === email)).toHaveLength(times),
    );
    return (mail.sendStaffInvite.mock.calls.findLast(([to]) => to === email) as [string, string])[1];
  };
  // Khoá đang chờ duyệt, gắn danh mục cấp 2.
  const pendingCourse = async (categoryId: string) => {
    const course = await prisma.course.create({
      data: {
        instructorId: teacher.id,
        title: 'E2E moderator',
        slug: `e2e-${randomUUID()}`,
        categoryId,
        status: 'in_review',
      },
    });
    const approval = await prisma.courseApproval.create({ data: { courseId: course.id, submittedById: teacher.id } });
    return approval.id;
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
    [admin, teacher, student] = await Promise.all([
      makeUser('student,admin'),
      makeUser('student,instructor'),
      makeUser(),
    ]);
    const roots = await prisma.category.findMany({
      where: { parentId: null, children: { some: {} } },
      orderBy: { position: 'asc' },
      take: 2,
      select: { id: true, children: { take: 1, select: { id: true } } },
    });
    [rootA, rootB] = roots.map((r) => ({ id: r.id, childId: r.children[0].id }));
    [approvalA, approvalB] = await Promise.all([pendingCourse(rootA.childId), pendingCourse(rootB.childId)]);
  }, 120_000);

  // Dọn: courses (cascade approvals) → users (cascade moderator_categories).
  afterAll(async () => {
    if (teacher) await prisma?.course.deleteMany({ where: { instructorId: teacher.id } });
    await prisma?.user.deleteMany({ where: { email: { in: [...emails, modEmail] } } });
    await app?.close();
  }, 120_000);

  describe('admin tạo moderator', () => {
    const body = () => ({ name: 'Kiểm duyệt A', email: modEmail, categoryIds: [rootA.id] });

    it('học viên gọi → 403', () => call('post', '/api/admin/moderators', student.cookie).send(body()).expect(403));

    it('danh mục cấp 2 hoặc không tồn tại → 400 INVALID_CATEGORY', async () => {
      for (const id of [rootA.childId, randomUUID()]) {
        const res = await call('post', '/api/admin/moderators', admin.cookie)
          .send({ ...body(), categoryIds: [id] })
          .expect(400);
        expect(res.body.code).toBe('INVALID_CATEGORY');
      }
    });

    it('danh mục trùng → 400 theo trường', async () => {
      const res = await call('post', '/api/admin/moderators', admin.cookie)
        .send({ ...body(), categoryIds: [rootA.id, rootA.id] })
        .expect(400);
      expect(res.body.errors[0].path).toEqual(['categoryIds']);
    });

    it('tạo → 201, gửi mail mời', async () => {
      const res = await call('post', '/api/admin/moderators', admin.cookie)
        .send({ ...body(), email: modEmail.toUpperCase() })
        .expect(201);
      modId = res.body.id;
      expect(res.body).toMatchObject({
        name: 'Kiểm duyệt A',
        email: modEmail,
        status: 'active',
        categories: [{ id: rootA.id, name: expect.any(String) }],
        reviewedCount: 0,
      });
      await inviteUrl(modEmail);
      expect(mail.sendResetPassword).not.toHaveBeenCalledWith(modEmail, expect.any(String));
    });

    it('trùng email → 409 EMAIL_TAKEN', async () => {
      const res = await call('post', '/api/admin/moderators', admin.cookie).send(body()).expect(409);
      expect(res.body.code).toBe('EMAIL_TAKEN');
    });

    it('list có moderator vừa tạo', async () => {
      const res = await call('get', '/api/admin/moderators', admin.cookie).expect(200);
      expect(res.body.items.find((m: { id: string }) => m.id === modId)).toMatchObject({ status: 'active' });
    });

    it('link mời → đặt mật khẩu → đăng nhập được', async () => {
      const url = new URL(await inviteUrl(modEmail));
      const redirect = await call('get', url.pathname + url.search).expect(302);
      const target = new URL(redirect.headers.location as string);
      expect(target.origin + target.pathname).toBe(`${FE_URL}/reset-password`);
      expect(target.searchParams.get('invite')).toBe('1');
      await call('post', '/api/auth/reset-password')
        .send({ token: target.searchParams.get('token'), newPassword: NEW_PASSWORD })
        .expect(200);
      mod = cookieOf(await signIn(modEmail, NEW_PASSWORD).expect(200));
    });
  });

  describe('tài khoản nghiệp vụ bị chặn chức năng học viên/giảng viên', () => {
    it('GET /me → 200', async () => {
      await call('get', '/api/me', mod).expect(200);
      await call('get', '/api/me', admin.cookie).expect(200);
    });

    it('giỏ hàng, bật giảng viên → 403 STAFF_ACCOUNT', async () => {
      for (const cookie of [mod, admin.cookie]) {
        expect((await call('get', '/api/cart', cookie).expect(403)).body.code).toBe('STAFF_ACCOUNT');
        expect((await call('post', '/api/me/become-instructor', cookie).expect(403)).body.code).toBe('STAFF_ACCOUNT');
      }
    });

    it('moderator gọi API chỉ-admin → 403', async () => {
      await call('get', '/api/admin/moderators', mod).expect(403);
      await call('get', '/api/admin/payouts', mod).expect(403);
    });
  });

  describe('moderator duyệt theo danh mục', () => {
    it('list chỉ có khoá thuộc danh mục gán, kèm danh mục', async () => {
      const res = await call('get', '/api/admin/course-approvals?status=pending', mod).expect(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      for (const item of res.body.items) expect(item.course.category.parent.id).toBe(rootA.id);
    });

    it('detail / duyệt khoá ngoài danh mục → 404', async () => {
      await call('get', `/api/admin/course-approvals/${approvalB}`, mod).expect(404);
      await call('post', `/api/admin/course-approvals/${approvalB}/approve`, mod).expect(404);
      await call('post', `/api/admin/course-approvals/${approvalB}/reject`, mod).send({ reason: 'x' }).expect(404);
      expect((await prisma.courseApproval.findUniqueOrThrow({ where: { id: approvalB } })).status).toBe('pending');
    });

    it('duyệt khoá trong danh mục → 200', async () => {
      const res = await call('post', `/api/admin/course-approvals/${approvalA}/approve`, mod).expect(200);
      expect(res.body.approval).toMatchObject({ status: 'approved', reviewedBy: { id: modId } });
    });

    it('admin vẫn thấy khoá mọi danh mục', () =>
      call('get', `/api/admin/course-approvals/${approvalB}`, admin.cookie).expect(200));

    it('sửa danh mục → thay toàn bộ tập, có hiệu lực ngay', async () => {
      const res = await call('put', `/api/admin/moderators/${modId}/categories`, admin.cookie)
        .send({ categoryIds: [rootB.id] })
        .expect(200);
      expect(res.body).toMatchObject({ categories: [{ id: rootB.id }], reviewedCount: 1 });
      await call('get', `/api/admin/course-approvals/${approvalB}`, mod).expect(200);
      await call('get', `/api/admin/course-approvals/${approvalA}`, mod).expect(404);
    });

    it('id không phải moderator → 404', () =>
      call('put', `/api/admin/moderators/${admin.id}/categories`, admin.cookie).send({ categoryIds: [] }).expect(404));
  });

  describe('khoá / mở khoá / gửi lại mời', () => {
    it('khoá → mất session, không đăng nhập được', async () => {
      const res = await call('post', `/api/admin/moderators/${modId}/lock`, admin.cookie).expect(200);
      expect(res.body.status).toBe('locked');
      await call('get', '/api/me', mod).expect(401);
      expect((await signIn(modEmail, NEW_PASSWORD).expect(403)).body.code).toBe('BANNED_USER');
    });

    it('mở khoá → đăng nhập lại được', async () => {
      const res = await call('post', `/api/admin/moderators/${modId}/unlock`, admin.cookie).expect(200);
      expect(res.body.status).toBe('active');
      await signIn(modEmail, NEW_PASSWORD).expect(200);
    });

    it('gửi lại mail mời → 204', async () => {
      await call('post', `/api/admin/moderators/${modId}/resend-invite`, admin.cookie).expect(204);
      await inviteUrl(modEmail, 2);
    });
  });
});
