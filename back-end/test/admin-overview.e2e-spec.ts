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

describe('Admin tổng quan (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn() };
  const emails: string[] = [];
  let admin: TestUser;
  let teacher: TestUser;
  let buyer: TestUser;
  let course: { id: string };

  const call = (method: 'get' | 'post', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = randomEmail();
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
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
    [admin, teacher, buyer] = await Promise.all([makeUser('student,admin'), makeUser('student,instructor'), makeUser()]);
    course = await prisma.course.create({
      data: { instructorId: teacher.id, title: 'E2E overview', slug: `e2e-${randomUUID()}`, status: 'published', priceAmount: 123_000 },
    });
  }, 120_000);

  afterAll(async () => {
    if (buyer) await prisma?.order.deleteMany({ where: { userId: buyer.id } });
    if (teacher) await prisma?.course.deleteMany({ where: { instructorId: teacher.id } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  const overview = async (range = '30d') =>
    (await call('get', `/api/admin/overview?range=${range}`, admin.cookie).expect(200)).body;

  it('học viên → 403, range sai → 400', async () => {
    await call('get', '/api/admin/overview', buyer.cookie).expect(403);
    await call('get', '/api/admin/overview?range=1y', admin.cookie).expect(400);
  });

  it('đúng hình dạng; daily đủ số ngày', async () => {
    for (const [range, days] of [['7d', 7], ['30d', 30], ['90d', 90]] as const) {
      const o = await overview(range);
      expect(o.range).toBe(range);
      expect(o.daily).toHaveLength(days);
      for (const k of ['gmv', 'platformFee', 'paidOrders', 'newUsers', 'newEnrollments', 'newCourses']) {
        expect(o.kpis[k]).toEqual({ value: expect.any(Number), prev: expect.any(Number) });
      }
      expect(o.topCourses.length).toBeLessThanOrEqual(5);
    }
  });

  // Các file e2e chạy song song có thể tạo đơn cùng lúc → so sánh ">=" thay vì bằng tuyệt đối.
  it('thêm 1 đơn paid lúc này → gmv, phí sàn, số đơn, ngày hôm nay và khoá bán chạy tăng theo', async () => {
    const before = await overview('7d');
    await prisma.order.create({
      data: {
        userId: buyer.id,
        status: 'paid',
        subtotalAmount: 123_000,
        totalAmount: 123_000,
        paidAt: new Date(),
        items: {
          create: {
            courseId: course.id,
            instructorId: teacher.id,
            listPriceAmount: 123_000,
            unitPriceAmount: 123_000,
            platformFeeAmount: 36_900,
            instructorEarnAmount: 86_100,
          },
        },
      },
    });
    const after = await overview('7d');
    expect(after.kpis.gmv.value - before.kpis.gmv.value).toBeGreaterThanOrEqual(123_000);
    expect(after.kpis.platformFee.value - before.kpis.platformFee.value).toBeGreaterThanOrEqual(36_900);
    expect(after.kpis.paidOrders.value - before.kpis.paidOrders.value).toBeGreaterThanOrEqual(1);
    expect(after.daily.at(-1).gmv - before.daily.at(-1).gmv).toBeGreaterThanOrEqual(123_000);
    expect(after.payouts.unsettledAmount - before.payouts.unsettledAmount).toBeGreaterThanOrEqual(86_100);
    const top = await overview('7d');
    if (top.topCourses.length < 5 || top.topCourses.some((c: { id: string }) => c.id === course.id)) {
      // Có chỗ trong top 5 hoặc đã lọt top → phải thấy khoá này với đúng tên giảng viên.
      const row = top.topCourses.find((c: { id: string }) => c.id === course.id);
      expect(row).toMatchObject({ title: 'E2E overview', instructorName: 'E2E', orders: 1, revenue: 123_000 });
    }
  });
});
