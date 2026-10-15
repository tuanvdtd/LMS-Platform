import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { randomInt, randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { reserveCoupon } from '../src/checkout/orders.js';
import { StripeGateway } from '../src/checkout/stripe.gateway.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStripe, signedEvent } from './fake-stripe.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const DAY = 86_400_000;
const T = 120_000;
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };
type Course = { id: string; slug: string };

describe('Cart, checkout, webhook, enroll (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stripe = new FakeStripe();
  const emails: string[] = [];
  const users: TestUser[] = [];
  const eventIds: string[] = [];
  let teacher: TestUser;
  let A: Course; // 499k
  let B: Course; // 299k
  let F: Course; // 0đ

  const call = (method: 'get' | 'post' | 'delete', path: string, cookie?: string) => {
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
    const u = { id: res.body.user.id as string, cookie: cookieOf(res) };
    users.push(u);
    return u;
  };
  const makeCourse = (priceAmount = 499_000) =>
    prisma.course.create({
      data: {
        instructorId: teacher.id,
        title: 'E2E',
        slug: `e2e-${randomUUID()}`,
        priceAmount,
        status: 'published',
        publishedAt: new Date(),
      },
      select: { id: true, slug: true },
    });
  const makeCoupon = (courseId: string, data: Partial<Prisma.CouponUncheckedCreateInput> = {}) =>
    prisma.coupon.create({
      data: {
        courseId,
        createdById: teacher.id,
        code: `C${randomUUID().slice(0, 8).toUpperCase()}`,
        type: 'fixed_price',
        priceAmount: 199_000,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 5 * DAY),
        ...data,
      },
      select: { id: true, code: true },
    });
  const freeCoupon = (courseId: string, data: Partial<Prisma.CouponUncheckedCreateInput> = {}) =>
    makeCoupon(courseId, { type: 'free', priceAmount: null, maxRedemptions: 5, ...data });

  const checkout = (u: TestUser, body: object = {}, key: string = randomUUID()) =>
    call('post', '/api/checkout', u.cookie).set('Idempotency-Key', key).send(body);
  const addToCart = (u: TestUser, c: Course) => call('post', `/api/cart/${c.id}`, u.cookie).expect(204);
  const sessionIdOf = (url: string) => url.split('/').pop()!;
  const send = (ev: { payload: string; header: string }) =>
    request(app.getHttpServer())
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', ev.header)
      .send(ev.payload);
  const event = (type: string, s: Stripe.Checkout.Session) => {
    const ev = signedEvent(type, s);
    eventIds.push(ev.id);
    return ev;
  };
  const webhook = (type: string, s: Stripe.Checkout.Session) => send(event(type, s));
  const couponCount = (id: string) => prisma.coupon.findUniqueOrThrow({ where: { id } }).then((c) => c.redeemedCount);
  const ordersOf = (userId: string) =>
    prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'asc' } });
  const orderBySession = (sid: string) =>
    prisma.order.findUniqueOrThrow({ where: { providerSessionId: sid }, include: { items: true } });
  // Checkout thành công → session id
  const buy = async (u: TestUser, body: object = {}, key?: string) => {
    const res = await checkout(u, body, key).expect(200);
    return sessionIdOf(res.body.url as string);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StripeGateway)
      .useValue(stripe)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    teacher = await makeUser('student,instructor');
    [A, B, F] = await Promise.all([makeCourse(499_000), makeCourse(299_000), makeCourse(0)]);
  }, T);

  // Dọn theo FK: payment_events → enrollments / cart_items / orders (cascade items) → coupons → courses → users.
  afterAll(async () => {
    const ids = users.map((u) => u.id);
    await prisma?.paymentEvent.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma?.enrollment.deleteMany({ where: { userId: { in: ids } } });
    await prisma?.cartItem.deleteMany({ where: { userId: { in: ids } } });
    await prisma?.order.deleteMany({ where: { userId: { in: ids } } });
    if (teacher) {
      await prisma?.coupon.deleteMany({ where: { createdById: teacher.id } });
      await prisma?.course.deleteMany({ where: { instructorId: teacher.id } });
    }
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  }, T);

  describe('giỏ', () => {
    it('thêm / trùng / khoá 0đ / khoá mình; GET /cart tổng 499000', async () => {
      const u = await makeUser();
      await call('post', `/api/cart/${A.id}`, u.cookie).expect(204);
      const dup = await call('post', `/api/cart/${A.id}`, u.cookie).expect(409);
      expect(dup.body.code).toBe('ALREADY_IN_CART');
      const free = await call('post', `/api/cart/${F.id}`, u.cookie).expect(400);
      expect(free.body.code).toBe('FREE_COURSE');
      const own = await call('post', `/api/cart/${A.id}`, teacher.cookie).expect(403);
      expect(own.body.code).toBe('OWN_COURSE');
      const cart = await call('get', '/api/cart', u.cookie).expect(200);
      expect(cart.body.items).toHaveLength(1);
      expect(cart.body.items[0]).toMatchObject({ course: { id: A.id }, listPrice: 499_000, finalPrice: 499_000, couponApplied: false });
      expect(cart.body.summary).toEqual({ subtotal: 499_000, discount: 0, total: 499_000 });
    }, T);

    it('GET /cart?couponCode: fixed → giảm; free → couponError nhắc trang khoá học', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const [fixed, free] = await Promise.all([makeCoupon(A.id), freeCoupon(A.id)]);
      const res = await call('get', `/api/cart?couponCode=${fixed.code.toLowerCase()}`, u.cookie).expect(200);
      expect(res.body.items[0]).toMatchObject({ finalPrice: 199_000, couponApplied: true });
      expect(res.body.summary).toEqual({ subtotal: 499_000, discount: 300_000, total: 199_000 });
      expect(res.body.couponError).toBeUndefined();
      const res2 = await call('get', `/api/cart?couponCode=${free.code}`, u.cookie).expect(200);
      expect(res2.body.couponError).toContain('trang khoá học');
      expect(res2.body.summary.total).toBe(499_000);
    }, T);

    it('GET /me/courses/:id/status', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const res = await call('get', `/api/me/courses/${A.id}/status`, u.cookie).expect(200);
      expect(res.body).toEqual({ inCart: true, enrolled: false, isOwner: false });
      const own = await call('get', `/api/me/courses/${A.id}/status`, teacher.cookie).expect(200);
      expect(own.body.isOwner).toBe(true);
    }, T);
  });

  describe('checkout', () => {
    it('thiếu Idempotency-Key → 400; giỏ rỗng → 400 CART_EMPTY', async () => {
      const u = await makeUser();
      const noKey = await call('post', '/api/checkout', u.cookie).send({}).expect(400);
      expect(noKey.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
      const empty = await checkout(u).expect(400);
      expect(empty.body.code).toBe('CART_EMPTY');
    }, T);

    it('giỏ + coupon fixed → order pending đúng tiền, giữ lượt, session đúng giá + hạn', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id);
      const before = Date.now();
      const res = await checkout(u, { couponCode: c.code }).expect(200);
      expect(res.body.url).toMatch(/^https:\/\/checkout\.stripe\.test\//);
      const [order] = await ordersOf(u.id);
      expect(order).toMatchObject({
        status: 'pending',
        subtotalAmount: 499_000,
        discountAmount: 300_000,
        totalAmount: 199_000,
        providerSessionId: sessionIdOf(res.body.url as string),
      });
      expect(order.items).toHaveLength(1);
      const item = order.items[0];
      expect(item).toMatchObject({ courseId: A.id, couponId: c.id, listPriceAmount: 499_000, unitPriceAmount: 199_000 });
      expect(item.platformFeeAmount + item.instructorEarnAmount).toBe(199_000);
      expect(await couponCount(c.id)).toBe(1);
      const params = stripe.created.at(-1)!;
      expect(params.metadata).toEqual({ orderId: order.id });
      expect(params.line_items![0].price_data!.unit_amount).toBe(199_000);
      const ttl = params.expires_at! * 1000 - before;
      expect(ttl).toBeGreaterThanOrEqual(30 * 60_000);
      expect(ttl).toBeLessThanOrEqual(32 * 60_000);
      expect(params.cancel_url).toBe(`${FE_URL}/cart`);
    }, T);

    it('cùng key gửi song song → cùng url, 1 order, giữ 1 lượt', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id);
      const key = randomUUID();
      const [r1, r2] = await Promise.all([checkout(u, { couponCode: c.code }, key), checkout(u, { couponCode: c.code }, key)]);
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.url).toBe(r2.body.url);
      expect(await prisma.order.count({ where: { userId: u.id, idempotencyKey: key } })).toBe(1);
      expect(await prisma.order.count({ where: { userId: u.id } })).toBe(1);
      expect(await couponCount(c.id)).toBe(1);
    }, T);

    it('key mới sau khi thêm khoá B → session cũ expired, order cũ failed, lượt giữ nguyên, order mới 2 item', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id);
      const oldSid = await buy(u, { couponCode: c.code });
      expect(await couponCount(c.id)).toBe(1);
      await addToCart(u, B);
      const newSid = await buy(u, { couponCode: c.code });
      expect(stripe.sessions.get(oldSid)!.status).toBe('expired');
      expect((await orderBySession(oldSid)).status).toBe('failed');
      expect(await couponCount(c.id)).toBe(1);
      const fresh = await orderBySession(newSid);
      expect(fresh.status).toBe('pending');
      expect(fresh.items.map((i) => i.courseId).sort()).toEqual([A.id, B.id].sort());
      expect(fresh.totalAmount).toBe(199_000 + 299_000);
    }, T);

    it('đơn cũ đã trả (chưa webhook) + Mua ngay cùng khoá → 409 ALREADY_ENROLLED, đơn cũ vẫn paid + ghi danh', async () => {
      const u = await makeUser();
      const oldSid = await buy(u, { courseId: A.id });
      stripe.pay(oldSid);
      const res = await checkout(u, { courseId: A.id }).expect(409);
      expect(res.body.code).toBe('ALREADY_ENROLLED');
      const old = await orderBySession(oldSid);
      expect(old.status).toBe('paid');
      const enr = await prisma.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: A.id } } });
      expect(enr.orderId).toBe(old.id);
    }, T);

    it('đơn cũ đã trả + key mới khoá khác → đơn cũ paid + ghi danh, có order pending cho khoá kia', async () => {
      const u = await makeUser();
      const oldSid = await buy(u, { courseId: A.id });
      stripe.pay(oldSid);
      const newSid = await buy(u, { courseId: B.id });
      expect((await orderBySession(oldSid)).status).toBe('paid');
      expect(await prisma.enrollment.count({ where: { userId: u.id, courseId: A.id } })).toBe(1);
      const fresh = await orderBySession(newSid);
      expect(fresh.status).toBe('pending');
      expect(fresh.items.map((i) => i.courseId)).toEqual([B.id]);
    }, T);

    it('cùng key sau khi session expired → 409 CHECKOUT_CLOSED', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const key = randomUUID();
      const sid = await buy(u, {}, key);
      stripe.expire(sid);
      const res = await checkout(u, {}, key).expect(409);
      expect(res.body.code).toBe('CHECKOUT_CLOSED');
    }, T);

    it('Stripe lỗi khi tạo session → 502, không order, không giữ lượt', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id);
      stripe.failNextCreate = true;
      const res = await checkout(u, { couponCode: c.code }).expect(502);
      expect(res.body.code).toBe('PAYMENT_PROVIDER_ERROR');
      expect(await prisma.order.count({ where: { userId: u.id } })).toBe(0);
      expect(await couponCount(c.id)).toBe(0);
    }, T);

    it('coupon hết lượt (maxRedemptions 1 đã dùng) → giỏ giá gốc; checkout gửi mã → 409 COUPON_UNAVAILABLE', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id, { maxRedemptions: 1, redeemedCount: 1 });
      const cart = await call('get', `/api/cart?couponCode=${c.code}`, u.cookie).expect(200);
      expect(cart.body.summary.total).toBe(499_000);
      expect(cart.body.couponError).toBeDefined();
      const res = await checkout(u, { couponCode: c.code }).expect(409);
      expect(res.body.code).toBe('COUPON_UNAVAILABLE');
      // không gửi mã → giá gốc
      const sid = await buy(u);
      expect((await orderBySession(sid)).totalAmount).toBe(499_000);
      expect(await couponCount(c.id)).toBe(1);
    }, T);

    it('coupon bị tắt sau khi giỏ thấy áp → 409 COUPON_UNAVAILABLE, không order, không đổi lượt', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id);
      const cart = await call('get', `/api/cart?couponCode=${c.code}`, u.cookie).expect(200);
      expect(cart.body.summary.total).toBe(199_000);
      await prisma.coupon.update({ where: { id: c.id }, data: { disabledAt: new Date() } });
      const res = await checkout(u, { couponCode: c.code }).expect(409);
      expect(res.body.code).toBe('COUPON_UNAVAILABLE');
      expect(await prisma.order.count({ where: { userId: u.id } })).toBe(0);
      expect(await couponCount(c.id)).toBe(0);
    }, T);

    it('reserveCoupon trên coupon đã đầy → COUPON_UNAVAILABLE (SQL thật)', async () => {
      const full = await makeCoupon(A.id, { maxRedemptions: 2, redeemedCount: 2 });
      await expect(prisma.$transaction((tx) => reserveCoupon(tx, full.id))).rejects.toMatchObject({
        response: { code: 'COUPON_UNAVAILABLE' },
      });
      expect(await couponCount(full.id)).toBe(2);
      const ok = await makeCoupon(A.id, { maxRedemptions: 2, redeemedCount: 1 });
      await prisma.$transaction((tx) => reserveCoupon(tx, ok.id));
      expect(await couponCount(ok.id)).toBe(2);
    }, T);

    it('giỏ có khoá bị gỡ xuất bản → GET /cart và order chỉ còn khoá hợp lệ', async () => {
      const u = await makeUser();
      const D = await makeCourse(199_000);
      await addToCart(u, A);
      await addToCart(u, D);
      await prisma.course.update({ where: { id: D.id }, data: { status: 'draft' } });
      const cart = await call('get', '/api/cart', u.cookie).expect(200);
      expect(cart.body.items.map((i: { course: { id: string } }) => i.course.id)).toEqual([A.id]);
      const sid = await buy(u);
      expect((await orderBySession(sid)).items.map((i) => i.courseId)).toEqual([A.id]);
    }, T);

    it('Mua ngay: 1 item, giỏ giữ khoá khác, cancel_url về trang khoá; 0đ / đã ghi danh / khoá mình bị chặn', async () => {
      const u = await makeUser();
      await addToCart(u, B);
      const sid = await buy(u, { courseId: A.id });
      const order = await orderBySession(sid);
      expect(order.items.map((i) => i.courseId)).toEqual([A.id]);
      expect(order.totalAmount).toBe(499_000);
      expect(await prisma.cartItem.count({ where: { userId: u.id, courseId: B.id } })).toBe(1);
      expect(stripe.created.at(-1)!.cancel_url).toBe(`${FE_URL}/course/${A.slug}`);

      const free = await checkout(u, { courseId: F.id }).expect(400);
      expect(free.body.code).toBe('FREE_COURSE');
      await prisma.enrollment.create({ data: { userId: u.id, courseId: B.id } });
      const enrolled = await checkout(u, { courseId: B.id }).expect(409);
      expect(enrolled.body.code).toBe('ALREADY_ENROLLED');
      const own = await checkout(teacher, { courseId: A.id }).expect(403);
      expect(own.body.code).toBe('OWN_COURSE');
    }, T);
  });

  describe('webhook', () => {
    it('completed → paid + ghi danh + xoá giỏ + processedAt; gửi lại / event mới cùng session không đổi gì', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const sid = await buy(u);
      const ev = event('checkout.session.completed', stripe.pay(sid));
      await send(ev).expect(200);
      const order = await orderBySession(sid);
      expect(order.status).toBe('paid');
      expect(order.paidAt).not.toBeNull();
      expect(order.providerPaymentIntentId).toMatch(/^pi_/);
      const enr = await prisma.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: A.id } } });
      expect(enr.orderId).toBe(order.id);
      expect(await prisma.cartItem.count({ where: { userId: u.id } })).toBe(0);
      const pe = await prisma.paymentEvent.findUniqueOrThrow({ where: { provider_eventId: { provider: 'stripe', eventId: ev.id } } });
      expect(pe.processedAt).not.toBeNull();

      await send(ev).expect(200);
      const again = await orderBySession(sid);
      expect(again.paidAt).toEqual(order.paidAt);
      await webhook('checkout.session.completed', stripe.sessions.get(sid)!).expect(200);
      expect(await prisma.enrollment.count({ where: { userId: u.id, courseId: A.id } })).toBe(1);
      expect((await orderBySession(sid)).paidAt).toEqual(order.paidAt);
    }, T);

    it('expired → failed + trả lượt (1 lần); completed sau đó → paid, giữ lại lượt', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id, { redeemedCount: 5 });
      const sid = await buy(u, { couponCode: c.code });
      expect(await couponCount(c.id)).toBe(6);
      await webhook('checkout.session.expired', stripe.expire(sid)).expect(200);
      expect((await orderBySession(sid)).status).toBe('failed');
      expect(await couponCount(c.id)).toBe(5);
      await webhook('checkout.session.expired', stripe.sessions.get(sid)!).expect(200);
      expect(await couponCount(c.id)).toBe(5);

      await webhook('checkout.session.completed', stripe.pay(sid)).expect(200);
      expect((await orderBySession(sid)).status).toBe('paid');
      expect(await prisma.enrollment.count({ where: { userId: u.id, courseId: A.id } })).toBe(1);
      expect(await couponCount(c.id)).toBe(6);
    }, T);

    it('completed sau failed khi coupon đã đầy → redeemedCount không vượt max, vẫn 200', async () => {
      const u = await makeUser();
      await addToCart(u, A);
      const c = await makeCoupon(A.id, { maxRedemptions: 1 });
      const sid = await buy(u, { couponCode: c.code });
      await webhook('checkout.session.expired', stripe.expire(sid)).expect(200);
      expect(await couponCount(c.id)).toBe(0);
      await prisma.coupon.update({ where: { id: c.id }, data: { redeemedCount: 1 } }); // người khác dùng
      await webhook('checkout.session.completed', stripe.pay(sid)).expect(200);
      expect((await orderBySession(sid)).status).toBe('paid');
      expect(await couponCount(c.id)).toBe(1);
    }, T);

    it('chữ ký sai → 400, không ghi payment_events', async () => {
      const before = await prisma.paymentEvent.count();
      const { payload } = signedEvent('checkout.session.completed', { id: 'cs_test_bad' } as Stripe.Checkout.Session);
      await send({ payload, header: 't=1,v1=bad' }).expect(400);
      expect(await prisma.paymentEvent.count()).toBe(before);
    }, T);

    it('completed với orderId không tồn tại → 200, processedAt có giá trị', async () => {
      const s = {
        id: `cs_test_${randomUUID()}`,
        status: 'complete',
        payment_status: 'paid',
        payment_intent: null,
        metadata: { orderId: randomUUID() },
      } as unknown as Stripe.Checkout.Session;
      const ev = event('checkout.session.completed', s);
      await send(ev).expect(200);
      const pe = await prisma.paymentEvent.findUniqueOrThrow({ where: { provider_eventId: { provider: 'stripe', eventId: ev.id } } });
      expect(pe.processedAt).not.toBeNull();
    }, T);
  });

  describe('enroll + của tôi', () => {
    it('khoá 0đ → 200; lần 2 → 409 ALREADY_ENROLLED', async () => {
      const u = await makeUser();
      const res = await call('post', `/api/courses/${F.id}/enroll`, u.cookie).send({}).expect(200);
      expect(res.body).toEqual({ enrolled: true });
      const again = await call('post', `/api/courses/${F.id}/enroll`, u.cookie).send({}).expect(409);
      expect(again.body.code).toBe('ALREADY_ENROLLED');
    }, T);

    it('khoá có phí: không mã → 400 PAYMENT_REQUIRED; mã free → 200 + giữ lượt; mã free đầy → 409', async () => {
      const u = await makeUser();
      const noCode = await call('post', `/api/courses/${A.id}/enroll`, u.cookie).send({}).expect(400);
      expect(noCode.body.code).toBe('PAYMENT_REQUIRED');
      const c = await freeCoupon(A.id);
      await call('post', `/api/courses/${A.id}/enroll`, u.cookie).send({ couponCode: c.code }).expect(200);
      expect(await couponCount(c.id)).toBe(1);
      const enr = await prisma.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: u.id, courseId: A.id } } });
      expect(enr.couponId).toBe(c.id);

      const u2 = await makeUser();
      const full = await freeCoupon(A.id, { maxRedemptions: 1, redeemedCount: 1 });
      const res = await call('post', `/api/courses/${A.id}/enroll`, u2.cookie).send({ couponCode: full.code }).expect(409);
      expect(res.body.code).toBe('COUPON_UNAVAILABLE');
    }, T);

    it('có đơn pending chứa khoá rồi enroll bằng mã free → đơn failed, session expired', async () => {
      const u = await makeUser();
      const sid = await buy(u, { courseId: A.id });
      const c = await freeCoupon(A.id);
      await call('post', `/api/courses/${A.id}/enroll`, u.cookie).send({ couponCode: c.code }).expect(200);
      expect((await orderBySession(sid)).status).toBe('failed');
      expect(stripe.sessions.get(sid)!.status).toBe('expired');
    }, T);

    it('GET /me/orders chỉ đơn paid; by-session đã trả chưa webhook → paid; /me/enrollments có khoá', async () => {
      const u = await makeUser();
      const paidSid = await buy(u, { courseId: A.id });
      await webhook('checkout.session.completed', stripe.pay(paidSid)).expect(200);
      const pendingSid = await buy(u, { courseId: B.id });
      const paidOrder = await orderBySession(paidSid);

      const orders = await call('get', '/api/me/orders', u.cookie).expect(200);
      expect(orders.body.map((o: { id: string }) => o.id)).toEqual([paidOrder.id]);

      stripe.pay(pendingSid);
      const bySession = await call('get', `/api/me/orders/by-session/${pendingSid}`, u.cookie).expect(200);
      expect(bySession.body.status).toBe('paid');

      const enr = await call('get', '/api/me/enrollments', u.cookie).expect(200);
      expect(enr.body.map((e: { course: { id: string } }) => e.course.id).sort()).toEqual([A.id, B.id].sort());
    }, T);

    it('đơn failed (webhook expired) mà session sau đó được trả → by-session trả paid', async () => {
      const u = await makeUser();
      const sid = await buy(u, { courseId: A.id });
      await webhook('checkout.session.expired', stripe.expire(sid)).expect(200);
      expect((await orderBySession(sid)).status).toBe('failed');
      stripe.pay(sid);
      const res = await call('get', `/api/me/orders/by-session/${sid}`, u.cookie).expect(200);
      expect(res.body.status).toBe('paid');
      expect(await prisma.enrollment.count({ where: { userId: u.id, courseId: A.id } })).toBe(1);
    }, T);
  });
});
