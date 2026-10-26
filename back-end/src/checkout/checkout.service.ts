import { BadGatewayException, BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import type Stripe from 'stripe';
import { isGuid } from '../common/zod.pipe.js';
import { activeCoupons } from '../coupons/active-coupons.js';
import { requireEnv } from '../env.js';
import { PrismaService } from '../infra/prisma.service.js';
import { splitRevenue } from '../revenue/split-revenue.js';
import { RevenueService } from '../revenue/revenue.service.js';
import { BUY_SELECT, type BuyableCourse, loadBuyable, loadCartCourses } from './buyable.js';
import type { CheckoutInput, EnrollInput } from './checkout.schemas.js';
import { cancelOrder, couponUnavailable, fulfill, reserveCoupon } from './orders.js';
import { priceLines, summarize } from './pricing.js';
import { StripeGateway } from './stripe.gateway.js';

type Tx = Prisma.TransactionClient;
type Pending = { id: string; providerSessionId: string | null };

const FE_URL = requireEnv('FE_URL');
const SESSION_TTL_SEC = 31 * 60; // Stripe đòi 30′–24h; chừa 1′ lệch giờ
// DB dev ~1-2s/query × ~10-15 query + Stripe ≤10.5s/lần + thời gian chờ lock của request song song (tính vào timeout).
// ponytail: giữ 1 connection tới vài chục giây mỗi checkout; nghẽn pool nếu tải cao → tách gọi Stripe ra ngoài TX.
const CHECKOUT_TX = { maxWait: 10_000, timeout: 60_000 };
const successUrl = (sessionId: string) => `${FE_URL}/checkout/success?session_id=${sessionId}`;
const checkoutClosed = () =>
  new ConflictException({ statusCode: 409, code: 'CHECKOUT_CLOSED', message: 'Phiên thanh toán đã hết hạn' });

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeGateway,
    private readonly revenue: RevenueService,
  ) {}

  // Lỗi mạng / Stripe → 502. Không dùng cho expire trong closePending (cần bắt lỗi riêng).
  private async stripeCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      Sentry.captureException(e);
      throw new BadGatewayException({ statusCode: 502, code: 'PAYMENT_PROVIDER_ERROR', message: 'Không kết nối được cổng thanh toán' });
    }
  }

  private lockUser(tx: Tx, userId: string) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}::text))`;
  }

  // Bước 1: cùng key → session cũ (open: url; complete: fulfill + url success; còn lại: 409).
  private async sameKey(tx: Tx, userId: string, key: string) {
    const o = await tx.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
      select: { providerSessionId: true },
    });
    if (!o) return null;
    if (!o.providerSessionId) throw checkoutClosed();
    const s = await this.stripeCall(() => this.stripe.retrieveSession(o.providerSessionId!));
    if (s.status === 'open') return { url: s.url! };
    if (s.status === 'complete') {
      await fulfill(tx, s);
      return { url: successUrl(s.id) };
    }
    throw checkoutClosed();
  }

  // Bước 3: còn mở → expire rồi huỷ (trả lượt ngay); đã trả → fulfill; đã hết hạn → huỷ.
  private async closePending(tx: Tx, order: Pending) {
    if (!order.providerSessionId) return cancelOrder(tx, order.id);
    let s = await this.stripeCall(() => this.stripe.retrieveSession(order.providerSessionId!));
    if (s.status === 'open') {
      try {
        s = await this.stripe.expireSession(s.id);
      } catch {
        s = await this.stripeCall(() => this.stripe.retrieveSession(s.id)); // vừa trả xong giữa retrieve và expire
        // Vẫn mở = expire lỗi mạng → không huỷ đơn khi session còn trả được; TX-A rollback, học viên bấm lại.
        if (s.status === 'open') {
          throw new BadGatewayException({ statusCode: 502, code: 'PAYMENT_PROVIDER_ERROR', message: 'Không kết nối được cổng thanh toán' });
        }
      }
    }
    if (s.status === 'complete') await fulfill(tx, s);
    else await cancelOrder(tx, order.id);
  }

  private async closePendings(tx: Tx, where: Prisma.OrderWhereInput) {
    const list = await tx.order.findMany({ where: { ...where, status: 'pending' }, select: { id: true, providerSessionId: true } });
    for (const o of list) await this.closePending(tx, o);
  }

  async checkout(userId: string, key: string, input: CheckoutInput) {
    // TX-A: cùng key + dọn đơn pending cũ, commit riêng → lỗi ở TX-B không rollback việc fulfill / huỷ
    // (expireSession trên Stripe không rollback được).
    const reused = await this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      const hit = await this.sameKey(tx, userId, key);
      if (hit) return hit;
      await this.closePendings(tx, { userId });
      return null;
    }, CHECKOUT_TX);
    if (reused) return reused;

    const pct = (await this.revenue.getSharePct()).sharePct;
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      // Request song song cùng key có thể vừa tạo đơn giữa TX-A và TX-B
      const hit = await this.sameKey(tx, userId, key);
      if (hit) return hit;
      // Tab khác (key khác) vừa tạo đơn giữa 2 TX → huỷ luôn (hiếm; lỗi phía sau có thể rollback việc huỷ này)
      await this.closePendings(tx, { userId });

      // 2. Lấy dòng
      let courses: BuyableCourse[];
      if (input.courseId) {
        const c = await loadBuyable(tx, userId, input.courseId);
        if (c.priceAmount === 0) {
          throw new BadRequestException({ statusCode: 400, code: 'FREE_COURSE', message: 'Khoá miễn phí — hãy ghi danh trực tiếp' });
        }
        courses = [c];
      } else {
        courses = await loadCartCourses(tx, userId);
        if (!courses.length) throw new BadRequestException({ statusCode: 400, code: 'CART_EMPTY', message: 'Giỏ hàng trống' });
      }
      const coupons = input.couponCode ? await activeCoupons(tx, input.couponCode, courses.map((c) => c.id)) : [];
      const lines = priceLines(courses, coupons);
      // FE chỉ gửi mã khi đang thấy nó được áp → không áp được nữa (hết hạn/hết lượt/bị tắt) thì báo, không lặng lẽ tính giá gốc.
      if (input.couponCode && !lines.some((l) => l.couponId)) throw couponUnavailable();

      // 4. Giữ lượt + tạo order
      for (const l of lines) if (l.couponId) await reserveCoupon(tx, l.couponId);
      const sum = summarize(lines);
      const order = await tx.order.create({
        data: {
          userId,
          idempotencyKey: key,
          provider: 'stripe',
          subtotalAmount: sum.subtotal,
          discountAmount: sum.discount,
          totalAmount: sum.total,
          items: { create: lines.map((l) => ({ ...l, ...splitRevenue(l.unitPriceAmount, pct) })) },
        },
        select: { id: true },
      });

      // 5. Stripe session — lỗi → 502, TX-B rollback (không đơn treo, không cần trả lượt)
      const titles = new Map(courses.map((c) => [c.id, c.title]));
      const buyNow = input.courseId ? courses[0] : null;
      const session = await this.stripeCall(() =>
        this.stripe.createSession({
          mode: 'payment',
          allowed_payment_method_types: ['card'], // stripe@23 bỏ payment_method_types
          locale: 'vi',
          line_items: lines.map((l) => ({
            quantity: 1,
            price_data: { currency: 'vnd', unit_amount: l.unitPriceAmount, product_data: { name: titles.get(l.courseId)! } },
          })),
          metadata: { orderId: order.id },
          client_reference_id: order.id,
          expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
          success_url: `${FE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: buyNow ? `${FE_URL}/course/${buyNow.slug}` : `${FE_URL}/cart`,
        }),
      );

      // 6.
      await tx.order.update({ where: { id: order.id }, data: { providerSessionId: session.id } });
      return { url: session.url! };
    }, CHECKOUT_TX);
  }

  async enroll(userId: string, courseId: string, input: EnrollInput) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      // Đơn pending có khoá này → huỷ (tránh trả tiền thừa) hoặc fulfill nếu đã trả. Làm TRƯỚC loadBuyable để
      // đơn vừa fulfill bị chặn bằng ALREADY_ENROLLED thay vì trừ oan lượt coupon free.
      if (isGuid(courseId)) await this.closePendings(tx, { userId, items: { some: { courseId } } });
      const course = await loadBuyable(tx, userId, courseId);
      let couponId: string | null = null;
      if (course.priceAmount > 0) {
        const [c] = input.couponCode ? await activeCoupons(tx, input.couponCode, [course.id]) : [];
        if (!c || c.type !== 'free') {
          if (input.couponCode) throw couponUnavailable();
          throw new BadRequestException({ statusCode: 400, code: 'PAYMENT_REQUIRED', message: 'Khoá có phí — hãy thanh toán' });
        }
        await reserveCoupon(tx, c.id);
        couponId = c.id;
      }
      await tx.enrollment.createMany({ data: [{ userId, courseId: course.id, couponId }], skipDuplicates: true });
      await tx.cartItem.deleteMany({ where: { userId, courseId: course.id } });
      return { enrolled: true };
    }, CHECKOUT_TX);
  }

  // ---- Webhook ----

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(rawBody, signature ?? '');
    } catch {
      throw new BadRequestException({ statusCode: 400, code: 'INVALID_SIGNATURE', message: 'Chữ ký webhook không hợp lệ' });
    }
    const pk = { provider_eventId: { provider: 'stripe' as const, eventId: event.id } };
    try {
      await this.prisma.paymentEvent.create({
        data: { provider: 'stripe', eventId: event.id, type: event.type, payload: event as unknown as Prisma.InputJsonValue },
      });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      const prev = await this.prisma.paymentEvent.findUnique({ where: pk, select: { processedAt: true } });
      if (prev?.processedAt) return { received: true };
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        if (event.type === 'checkout.session.completed') {
          const res = await fulfill(tx, event.data.object);
          // Session mồ côi (commit TX-B hỏng sau khi tạo session) hoặc metadata lạ → ghi nhận, không retry.
          if (res === 'order_not_found') Sentry.captureMessage(`Stripe webhook: không thấy order của session ${event.data.object.id}`);
        } else if (event.type === 'checkout.session.expired') {
          const orderId = event.data.object.metadata?.orderId;
          if (orderId && isGuid(orderId)) await cancelOrder(tx, orderId);
        }
        await tx.paymentEvent.update({ where: pk, data: { processedAt: new Date(), error: null } });
      }, CHECKOUT_TX);
    } catch (e) {
      await this.prisma.paymentEvent.update({ where: pk, data: { error: String(e) } }).catch(() => undefined);
      throw e; // 500 → Stripe gửi lại
    }
    return { received: true };
  }

  // ---- Của tôi ----

  async myOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId, status: 'paid' },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true, paidAt: true, subtotalAmount: true, discountAmount: true, totalAmount: true, provider: true,
        items: {
          select: {
            listPriceAmount: true, unitPriceAmount: true,
            coupon: { select: { code: true } },
            course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
          },
        },
      },
    });
  }

  // Trang success: chưa paid → hỏi Stripe, đã trả thì fulfill luôn (không phụ thuộc hẳn webhook). Gồm cả đơn
  // `failed` mà session `complete` (trả ở tab cũ đúng lúc đơn bị huỷ).
  async orderBySession(userId: string, sessionId: string) {
    const find = () =>
      this.prisma.order.findFirst({
        where: { userId, providerSessionId: sessionId },
        select: { id: true, status: true, items: { select: { course: { select: { slug: true, title: true } } } } },
      });
    const order = await find();
    if (!order) throw new NotFoundException({ statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
    if (order.status === 'paid') return order;
    const s = await this.stripeCall(() => this.stripe.retrieveSession(sessionId));
    if (s.status !== 'complete') return order;
    await this.prisma.$transaction((tx) => fulfill(tx, s), CHECKOUT_TX);
    return find();
  }

  myEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        progressPct: true,
        course: { select: { ...BUY_SELECT, instructor: { select: { name: true } } } },
      },
    });
  }
}
