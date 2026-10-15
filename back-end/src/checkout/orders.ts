import { ConflictException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { isGuid } from '../common/zod.pipe.js';

type Tx = Prisma.TransactionClient;

export const couponUnavailable = () =>
  new ConflictException({ statusCode: 409, code: 'COUPON_UNAVAILABLE', message: 'Coupon đã hết lượt hoặc hết hạn' });

// Trừ 1 lượt atomic (spec curriculum-schema §3.5). Cùng điều kiện với isCouponActive.
export async function reserveCoupon(tx: Tx, couponId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    UPDATE coupons SET "redeemedCount" = "redeemedCount" + 1
    WHERE id = ${couponId}::uuid AND "disabledAt" IS NULL AND now() BETWEEN "startsAt" AND "endsAt"
      AND ("maxRedemptions" IS NULL OR "redeemedCount" < "maxRedemptions")
    RETURNING id::text AS id`;
  if (!rows.length) throw couponUnavailable();
}

const couponIdsOf = async (tx: Tx, orderId: string) =>
  (await tx.orderItem.findMany({ where: { orderId, couponId: { not: null } }, select: { couponId: true } })).map((i) => i.couponId!);

// pending → failed + trả lượt coupon. Chỉ trả khi chính lệnh này chuyển trạng thái → không trả 2 lần.
export async function cancelOrder(tx: Tx, orderId: string) {
  const res = await tx.order.updateMany({ where: { id: orderId, status: 'pending' }, data: { status: 'failed' } });
  if (!res.count) return;
  const ids = await couponIdsOf(tx, orderId);
  if (ids.length) {
    await tx.$executeRaw`UPDATE coupons SET "redeemedCount" = "redeemedCount" - 1
      WHERE id = ANY(${ids}::uuid[]) AND "redeemedCount" > 0`;
  }
}

export type FulfillResult = 'unpaid' | 'order_not_found' | 'already_paid' | 'paid';

// Session đã trả → order paid + ghi danh + xoá giỏ (spec §8). Idempotent: khoá dòng order rồi UPDATE có điều kiện.
export async function fulfill(tx: Tx, session: Stripe.Checkout.Session): Promise<FulfillResult> {
  if (session.payment_status !== 'paid') return 'unpaid';
  const orderId = session.metadata?.orderId;
  if (!orderId || !isGuid(orderId)) return 'order_not_found';
  const [row] = await tx.$queryRaw<{ status: string }[]>`
    SELECT status::text AS status FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
  if (!row) return 'order_not_found';
  // Chỉ pending/failed → paid (spec §8); paid / refunded / partially_refunded giữ nguyên.
  if (row.status !== 'pending' && row.status !== 'failed') return 'already_paid';
  const order = await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      providerPaymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
    },
    select: { userId: true, items: { select: { courseId: true, couponId: true } } },
  });
  if (row.status === 'failed') {
    // Đã trả lượt lúc huỷ nhưng học viên vẫn trả tiền → giữ lại lượt. LEAST vì chk_coupon_redemptions
    // không cho vượt maxRedemptions; chấp nhận lệch 1 lượt thay vì webhook 500 mãi.
    const ids = order.items.flatMap((i) => (i.couponId ? [i.couponId] : []));
    if (ids.length) {
      await tx.$executeRaw`UPDATE coupons
        SET "redeemedCount" = LEAST("redeemedCount" + 1, coalesce("maxRedemptions", "redeemedCount" + 1))
        WHERE id = ANY(${ids}::uuid[])`;
    }
  }
  const courseIds = order.items.map((i) => i.courseId);
  await tx.enrollment.createMany({
    data: courseIds.map((courseId) => ({ userId: order.userId, courseId, orderId })),
    skipDuplicates: true,
  });
  await tx.cartItem.deleteMany({ where: { userId: order.userId, courseId: { in: courseIds } } });
  return 'paid';
}
