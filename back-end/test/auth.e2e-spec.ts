import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Roles } from '../src/auth/decorators.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () =>
  `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const randomEmail = () => `e2e-${randomUUID()}@example.com`;

@Controller('probe')
class ProbeController {
  @Roles('admin')
  @Get('admin')
  admin() {
    return 'ok';
  }

  @Roles('instructor')
  @Get('instructor')
  instructor() {
    return 'ok';
  }
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminCookie: string;
  let studentCookie: string;
  let studentId: string;
  const studentEmail = randomEmail();
  const createdEmails: string[] = [];
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn() };

  // Bộ đếm rate limit nằm ở Redis và sống qua các lần chạy → mỗi request một IP
  // ngẫu nhiên (Better Auth chỉ tin X-Forwarded-For một giá trị).
  // Origin luôn gửi vì Better Auth kiểm tra origin với request có cookie.
  const call = (
    method: 'get' | 'post',
    path: string,
    opts: { cookie?: string; ip?: string } = {},
  ) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', opts.ip ?? randomIp());
    return opts.cookie ? r.set('Cookie', opts.cookie) : r;
  };
  const signUp = (email: string, ip?: string) => {
    createdEmails.push(email);
    return call('post', '/api/auth/sign-up/email', { ip }).send({
      name: 'E2E',
      email,
      password: PASSWORD,
    });
  };
  const signIn = (email: string) =>
    call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD });
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[])
      .map((c) => c.split(';')[0])
      .join('; ');
  const verifyPathFor = async (email: string) => {
    await vi.waitFor(() =>
      expect(mail.sendVerification).toHaveBeenCalledWith(email, expect.any(String)),
    );
    const [, url] = mail.sendVerification.mock.calls.findLast(
      ([to]) => to === email,
    ) as [string, string];
    const { pathname, search } = new URL(url);
    return pathname + search;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Không có endpoint tự nâng quyền (spec §9) → nâng admin thẳng qua DB.
    const adminEmail = randomEmail();
    await signUp(adminEmail).expect(200);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'admin', emailVerified: true },
    });
    adminCookie = cookieOf(await signIn(adminEmail).expect(200));
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app?.close();
  });

  it('1. sign-up gửi mail xác minh', async () => {
    const res = await signUp(studentEmail).expect(200);
    studentId = res.body.user.id;
    await verifyPathFor(studentEmail);
  });

  it('2. chưa xác minh thì không sign-in được', async () => {
    const res = await signIn(studentEmail).expect(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('3. mở link xác minh rồi sign-in được', async () => {
    const res = await call('get', await verifyPathFor(studentEmail));
    expect(res.status).toBeLessThan(400);
    studentCookie = cookieOf(await signIn(studentEmail).expect(200));
  });

  it('4. /api/me cần session', async () => {
    const res = await call('get', '/api/me', { cookie: studentCookie }).expect(200);
    expect(res.body).toMatchObject({
      email: studentEmail,
      role: 'student',
      emailVerified: true,
    });
    await call('get', '/api/me').expect(401);
  });

  it('5. @Roles chặn sai role; đổi role có hiệu lực ngay (Redis được làm mới)', async () => {
    await call('get', '/api/probe/admin', { cookie: studentCookie }).expect(403);
    await call('post', '/api/auth/admin/set-role', { cookie: adminCookie })
      .send({ userId: studentId, role: 'instructor' })
      .expect(200);
    await call('get', '/api/probe/instructor', { cookie: studentCookie }).expect(200);
  });

  it('6. bị ban thì mất session', async () => {
    await call('post', '/api/auth/admin/ban-user', { cookie: adminCookie })
      .send({ userId: studentId })
      .expect(200);
    await call('get', '/api/me', { cookie: studentCookie }).expect(401);
  });

  it('7. sign-up quá 3 lần / 10 phút cùng IP thì 429', async () => {
    const ip = randomIp();
    for (let i = 0; i < 3; i++) await signUp(randomEmail(), ip).expect(200);
    await signUp(randomEmail(), ip).expect(429);
  });
});
