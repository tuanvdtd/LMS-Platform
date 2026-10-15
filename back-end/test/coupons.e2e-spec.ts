import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { StripeGateway } from '../src/checkout/stripe.gateway.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStripe } from './fake-stripe.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const DAY = 86_400_000;
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };
type FieldErr = { path: string[] };

describe('Instructor coupons (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let teacher: TestUser;
  let other: TestUser; // giảng viên khác
  let student: TestUser;
  let course: { id: string; slug: string };
  let fullCourse: { id: string; slug: string }; // dùng cho giới hạn 3 coupon/tháng
  let freeCourse: { id: string; slug: string };
  let couponId: string;

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string) => {
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
  const makeCourse = (instructorId: string, priceAmount = 499_000) =>
    prisma.course.create({
      data: { instructorId, title: 'E2E', slug: `e2e-${randomUUID()}`, priceAmount, status: 'published', publishedAt: new Date() },
      select: { id: true, slug: true },
    });
  const fixed = (o: object = {}) => ({
    code: 'sale.oct',
    type: 'fixed_price',
    priceAmount: 199_000,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 10 * DAY).toISOString(),
    ...o,
  });
  const create = (courseId: string, body: object, cookie = teacher.cookie) =>
    call('post', `/api/instructor/courses/${courseId}/coupons`, cookie).send(body);
  const paths = (res: Response) => (res.body.errors as FieldErr[]).map((e) => e.path.join('.'));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StripeGateway)
      .useValue(new FakeStripe())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [teacher, other, student] = await Promise.all([
      makeUser('student,instructor'),
      makeUser('student,instructor'),
      makeUser(),
    ]);
    [course, fullCourse, freeCourse] = await Promise.all([
      makeCourse(teacher.id),
      makeCourse(teacher.id),
      makeCourse(teacher.id, 0),
    ]);
  }, 120_000);

  afterAll(async () => {
    const ids = [teacher, other, student].filter(Boolean).map((u) => u.id);
    await prisma?.coupon.deleteMany({ where: { createdById: { in: ids } } });
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, 120_000);

  it('tạo fixed_price hợp lệ (mã có dấu chấm) → 201', async () => {
    const res = await create(course.id, fixed()).expect(201);
    expect(res.body).toMatchObject({ code: 'SALE.OCT', type: 'fixed_price', priceAmount: 199_000, redeemedCount: 0, disabledAt: null });
    couponId = res.body.id as string;
  }, 120_000);

  it('trùng mã → 409 COUPON_CODE_TAKEN', async () => {
    const res = await create(course.id, fixed({ code: 'SALE.oct' })).expect(409);
    expect(res.body.code).toBe('COUPON_CODE_TAKEN');
  }, 120_000);

  it('giá không phải bậc / không rẻ hơn → 400 errors[priceAmount]', async () => {
    const notTier = await create(course.id, fixed({ code: 'NOTTIER1', priceAmount: 150_000 })).expect(400);
    expect(paths(notTier)).toContain('priceAmount');
    const notCheaper = await create(course.id, fixed({ code: 'NOTCHEAP1', priceAmount: 499_000 })).expect(400);
    expect(paths(notCheaper)).toContain('priceAmount');
  }, 120_000);

  it('free thiếu maxRedemptions → 400', async () => {
    const res = await create(course.id, {
      code: 'FREEDEMO',
      type: 'free',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 2 * DAY).toISOString(),
    }).expect(400);
    expect(paths(res)).toContain('maxRedemptions');
  }, 120_000);

  it('khoá 0đ → 409 COURSE_FREE', async () => {
    const res = await create(freeCourse.id, fixed()).expect(409);
    expect(res.body.code).toBe('COURSE_FREE');
  }, 120_000);

  it('không phải chủ khoá → 404 COURSE_NOT_FOUND', async () => {
    const res = await create(course.id, fixed({ code: 'OTHER.1' }), other.cookie).expect(404);
    expect(res.body.code).toBe('COURSE_NOT_FOUND');
    await call('get', `/api/instructor/courses/${course.id}/coupons`, other.cookie).expect(404);
    await call('patch', `/api/instructor/courses/${course.id}/coupons/${couponId}/disable`, other.cookie).expect(404);
  }, 120_000);

  it('học viên gọi → 403', async () => {
    await create(course.id, fixed({ code: 'STUDENT1' }), student.cookie).expect(403);
  }, 120_000);

  it('tạo coupon thứ 4 trong tháng → 400', async () => {
    const now = Date.now();
    await prisma.coupon.createMany({
      data: [1, 2, 3].map((i) => ({
        courseId: fullCourse.id,
        createdById: teacher.id,
        code: `MONTH-${i}X`,
        type: 'fixed_price' as const,
        priceAmount: 199_000,
        startsAt: new Date(now),
        endsAt: new Date(now + DAY),
      })),
    });
    const res = await create(fullCourse.id, fixed({ code: 'MONTH-4X' })).expect(400);
    expect(paths(res)).toContain('');
  }, 120_000);

  it('GET /api/courses/:slug/coupons/:code còn hiệu lực → { type, priceAmount }', async () => {
    const res = await call('get', `/api/courses/${course.slug}/coupons/sale.oct`).expect(200);
    expect(res.body).toEqual({ type: 'fixed_price', priceAmount: 199_000 });
    await call('get', `/api/courses/${course.slug}/coupons/NOPE-123`).expect(404);
  }, 120_000);

  it('disable → disabledAt có giá trị; GET /api/courses/:slug/coupons/:code → 404', async () => {
    const res = await call('patch', `/api/instructor/courses/${course.id}/coupons/${couponId}/disable`, teacher.cookie).expect(200);
    expect(res.body.disabledAt).not.toBeNull();
    const list = await call('get', `/api/instructor/courses/${course.id}/coupons`, teacher.cookie).expect(200);
    expect(list.body.items.find((c: { id: string }) => c.id === couponId).disabledAt).not.toBeNull();
    await call('get', `/api/courses/${course.slug}/coupons/SALE.OCT`).expect(404);
  }, 120_000);
});
