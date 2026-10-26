import type { Prisma } from '@prisma/client';
import { isCouponActive } from './coupon-rules.js';

type Db = Pick<Prisma.TransactionClient, 'coupon'>;

// Coupon còn hiệu lực theo mã cho các khoá (1 mã áp cho mọi khoá có coupon cùng code).
// Điều kiện lượt so 2 cột → lọc trong JS bằng isCouponActive.
export async function activeCoupons(db: Db, code: string, courseIds: string[], now = new Date()) {
  if (!courseIds.length) return [];
  const rows = await db.coupon.findMany({
    where: { code: code.trim().toUpperCase(), courseId: { in: courseIds }, disabledAt: null, startsAt: { lte: now }, endsAt: { gte: now } },
    select: { id: true, courseId: true, type: true, priceAmount: true, disabledAt: true, startsAt: true, endsAt: true, maxRedemptions: true, redeemedCount: true },
  });
  return rows.filter((c) => isCouponActive(c, now));
}
