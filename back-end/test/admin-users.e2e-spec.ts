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
const randomEmail = () => `e2e-${randomUUID()}@example.com`;

type TestUser = { id: string; email: string; cookie: string };

describe('Admin quản lý người dùng (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mail = {
    sendVerification: vi.fn(),
    sendResetPassword: vi.fn(),
    sendStaffInvite: vi.fn(),
    sendAccountLocked: vi.fn(),
  };
  const emails: string[] = [];
  let admin: TestUser;
  let moderator: TestUser;
  let teacher: TestUser;
  let student: TestUser;
  let target: TestUser;

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
    return { id: res.body.user.id as string, email, cookie: cookieOf(res) };
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
    [admin, moderator, teacher, student, target] = await Promise.all([
      makeUser('student,admin'),
      makeUser('moderator'),
      makeUser('student,instructor'),
      makeUser(),
      makeUser(),
    ]);
  }, 120_000);

  afterAll(async () => {
    if (target && moderator) {
      await prisma?.auditLog.deleteMany({ where: { targetId: { in: [target.id, moderator.id] } } });
    }
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  it('học viên và moderator gọi → 403', async () => {
    await call('get', '/api/admin/users', student.cookie).expect(403);
    await call('get', '/api/admin/users', moderator.cookie).expect(403);
  });

  it('danh sách không có tài khoản staff; tìm theo email ra đúng người', async () => {
    const res = await call('get', `/api/admin/users?q=${encodeURIComponent(target.email)}`, admin.cookie).expect(200);
    expect(res.body.items.map((u: { id: string }) => u.id)).toEqual([target.id]);
    expect(res.body.items[0]).toMatchObject({ roles: ['student'], verified: false, status: 'active', enrollmentCount: 0, courseCount: 0 });
    for (const staff of [admin, moderator]) {
      const r = await call('get', `/api/admin/users?q=${encodeURIComponent(staff.email)}`, admin.cookie).expect(200);
      expect(r.body.total).toBe(0);
    }
  });

  it('lọc vai trò giảng viên có teacher, không có student', async () => {
    const has = async (role: string, u: { email: string }) =>
      (await call('get', `/api/admin/users?role=${role}&q=${encodeURIComponent(u.email)}`, admin.cookie).expect(200)).body.total;
    expect(await has('instructor', teacher)).toBe(1);
    expect(await has('instructor', student)).toBe(0);
    expect(await has('student', student)).toBe(1);
    expect(await has('student', teacher)).toBe(0);
  });

  it('query sai → 400', () => call('get', '/api/admin/users?role=boss', admin.cookie).expect(400));

  it('chi tiết: staff hoặc id sai → 404; người thường → đủ các phần', async () => {
    await call('get', `/api/admin/users/${moderator.id}`, admin.cookie).expect(404);
    await call('get', '/api/admin/users/khong-phai-uuid', admin.cookie).expect(404);
    const res = await call('get', `/api/admin/users/${teacher.id}`, admin.cookie).expect(200);
    expect(res.body).toMatchObject({ id: teacher.id, status: 'active', loginMethods: ['credential'], roles: ['student', 'instructor'] });
    expect(res.body.teaching).toMatchObject({ courseCount: 0, publishedCount: 0, totalEarned: 0 });
    expect(res.body.sessions.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toContain('"token"');
    const s = await call('get', `/api/admin/users/${student.id}`, admin.cookie).expect(200);
    expect(s.body.teaching).toBeNull();
  });

  it('khoá thiếu lý do → 400', async () => {
    await call('post', `/api/admin/users/${target.id}/lock`, admin.cookie).send({ reason: 'abc', duration: '7d' }).expect(400);
    await call('post', `/api/admin/users/${target.id}/lock`, admin.cookie).send({ reason: 'Spam bình luận', duration: '1y' }).expect(400);
  });

  it('khoá moderator qua /admin/users → 404', () =>
    call('post', `/api/admin/users/${moderator.id}/lock`, admin.cookie).send({ reason: 'Thử khoá staff', duration: '7d' }).expect(404));

  it('khoá 7 ngày: phiên cũ mất, không đăng nhập được, có nhật ký + email', async () => {
    const res = await call('post', `/api/admin/users/${target.id}/lock`, admin.cookie)
      .send({ reason: 'Spam bình luận nhiều lần', duration: '7d' })
      .expect(200);
    expect(res.body).toMatchObject({ status: 'locked', lockReason: 'Spam bình luận nhiều lần' });
    const until = new Date(res.body.lockedUntil).getTime();
    expect(until).toBeGreaterThan(Date.now() + 6.9 * 86_400_000);
    expect(until).toBeLessThan(Date.now() + 7.1 * 86_400_000);
    expect(res.body.audit[0]).toMatchObject({ action: 'user_lock', data: { reason: 'Spam bình luận nhiều lần' } });
    expect(res.body.audit[0].actorName).toBe('E2E');
    expect(mail.sendAccountLocked).toHaveBeenCalledWith(target.email, 'Spam bình luận nhiều lần', expect.any(Date));
    await call('get', '/api/me/preferences', target.cookie).expect(401);
    const login = await signIn(target.email, PASSWORD);
    expect(login.body.code).toBe('BANNED_USER');
    const list = await call('get', `/api/admin/users?status=locked&q=${encodeURIComponent(target.email)}`, admin.cookie).expect(200);
    expect(list.body.total).toBe(1);
  });

  it('mở khoá: đăng nhập lại được; mở khoá lần 2 → 409', async () => {
    const res = await call('post', `/api/admin/users/${target.id}/unlock`, admin.cookie).expect(200);
    expect(res.body.status).toBe('active');
    expect(res.body.audit[0].action).toBe('user_unlock');
    const login = await signIn(target.email, PASSWORD).expect(200);
    target.cookie = cookieOf(login);
    const again = await call('post', `/api/admin/users/${target.id}/unlock`, admin.cookie).expect(409);
    expect(again.body.code).toBe('USER_NOT_LOCKED');
  });

  it('ban đã hết hạn tính là active, không mở khoá được', async () => {
    const u = await makeUser();
    await prisma.user.update({ where: { id: u.id }, data: { banned: true, banReason: 'x', banExpires: new Date(Date.now() - 3_600_000) } });
    const q = encodeURIComponent(u.email);
    const active = await call('get', `/api/admin/users?status=active&q=${q}`, admin.cookie).expect(200);
    expect(active.body.total).toBe(1);
    const locked = await call('get', `/api/admin/users?status=locked&q=${q}`, admin.cookie).expect(200);
    expect(locked.body.total).toBe(0);
    const detail = await call('get', `/api/admin/users/${u.id}`, admin.cookie).expect(200);
    expect(detail.body.status).toBe('active');
    const unlock = await call('post', `/api/admin/users/${u.id}/unlock`, admin.cookie).expect(409);
    expect(unlock.body.code).toBe('USER_NOT_LOCKED');
  });

  it('đăng xuất mọi thiết bị: cookie cũ hết hiệu lực, có nhật ký', async () => {
    await call('get', '/api/me/preferences', target.cookie).expect(200);
    const res = await call('post', `/api/admin/users/${target.id}/revoke-sessions`, admin.cookie).expect(200);
    expect(res.body.sessions).toEqual([]);
    expect(res.body.audit[0].action).toBe('user_revoke_sessions');
    await call('get', '/api/me/preferences', target.cookie).expect(401);
  });

  it('khoá/mở khoá moderator ở trang Moderator cũng ghi nhật ký', async () => {
    await call('post', `/api/admin/moderators/${moderator.id}/lock`, admin.cookie).expect(200);
    await call('post', `/api/admin/moderators/${moderator.id}/unlock`, admin.cookie).expect(200);
    const logs = await prisma.auditLog.findMany({ where: { targetId: moderator.id }, orderBy: { createdAt: 'asc' } });
    expect(logs.map((l) => l.action)).toEqual(['user_lock', 'user_unlock']);
    expect(logs[0].actorId).toBe(admin.id);
  });
});
