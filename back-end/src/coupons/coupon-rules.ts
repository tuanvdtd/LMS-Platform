import type { FieldError } from '../common/zod.pipe.js';
import { isPriceTier } from '../revenue/price-guard.js';

// Luật coupon: định dạng mã, thời hạn theo loại, số coupon mỗi tháng, khi nào còn dùng được. Hàm thuần.
export const COUPON_CODE_RE = /^[A-Z0-9._-]{6,20}$/;
const DAY = 86_400_000;
const MAX_DAYS = { fixed_price: 31, free: 5 } as const;
const MAX_PER_MONTH = 3;
const START_SKEW_MS = 5 * 60_000; // form gửi "bây giờ" có thể trễ vài giây–phút

export type CouponInput = {
  code: string;
  type: 'fixed_price' | 'free';
  priceAmount?: number;
  startsAt: Date;
  endsAt: Date;
  maxRedemptions?: number;
};

export function couponProblems(
  input: CouponInput,
  ctx: { coursePriceAmount: number; createdThisMonth: number; now: Date },
): FieldError[] {
  const errors: FieldError[] = [];
  const err = (path: string, message: string) => errors.push({ path: path ? [path] : [], message });

  if (ctx.createdThisMonth >= MAX_PER_MONTH) err('', `Mỗi khoá tối đa ${MAX_PER_MONTH} coupon mỗi tháng`);
  if (!COUPON_CODE_RE.test(input.code)) err('code', 'Mã 6–20 ký tự: A-Z, 0-9, dấu . - _');

  if (input.type === 'fixed_price') {
    const p = input.priceAmount;
    if (p === undefined || !isPriceTier(p) || p <= 0 || p >= ctx.coursePriceAmount) {
      err('priceAmount', 'Chọn một bậc giá thấp hơn giá khoá');
    }
  } else {
    if (input.priceAmount !== undefined) err('priceAmount', 'Coupon miễn phí không có giá');
    if (!input.maxRedemptions) err('maxRedemptions', 'Coupon miễn phí phải giới hạn số lượt');
  }

  if (input.startsAt.getTime() < ctx.now.getTime() - START_SKEW_MS) err('startsAt', 'Ngày bắt đầu đã qua');
  const span = input.endsAt.getTime() - input.startsAt.getTime();
  if (span <= 0) err('endsAt', 'Ngày kết thúc phải sau ngày bắt đầu');
  else if (span > MAX_DAYS[input.type] * DAY) err('endsAt', `Tối đa ${MAX_DAYS[input.type]} ngày`);
  return errors;
}

type ActiveFields = {
  disabledAt: Date | null;
  startsAt: Date;
  endsAt: Date;
  maxRedemptions: number | null;
  redeemedCount: number;
};
// Cùng điều kiện với câu UPDATE trừ lượt (orders.ts) — đổi một chỗ phải đổi cả hai.
export const isCouponActive = (c: ActiveFields, now: Date) =>
  c.disabledAt === null &&
  c.startsAt <= now &&
  now <= c.endsAt &&
  (c.maxRedemptions === null || c.redeemedCount < c.maxRedemptions);

// Đầu tháng dương lịch giờ VN (UTC+7, không có giờ mùa hè) dưới dạng instant UTC.
export function vnMonthStart(now: Date): Date {
  const vn = new Date(now.getTime() + 7 * 3_600_000);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - 7 * 3_600_000);
}
