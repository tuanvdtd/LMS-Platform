import type { CourseStatus } from '@prisma/client';

// Bậc giá cố định, VND. FE giữ bản sao ở types/instructor-course.ts.
export const PRICE_TIERS: readonly number[] = [0, 99_000, 199_000, 299_000, 499_000, 799_000, 999_000, 1_499_000, 1_999_000];
export const isPriceTier = (n: number) => PRICE_TIERS.includes(n);

export type PriceGuardInput = {
  status: CourseStatus;
  publishedAt: Date | null;
  newPriceAmount: number;
  isVerified: boolean; // có bản ghi instructor_profiles
  hasPayoutAccount: boolean; // instructor_profiles.bankBin khác null
};

// Dùng cho PUT /instructor/courses/:id/price.
// Giá khoá vĩnh viễn từ lần xuất bản đầu (publishedAt chỉ ghi lần duyệt đầu); đổi giá sau đó chỉ bằng coupon.
export function priceChangeProblem(c: PriceGuardInput): { status: 400 | 403 | 409; code: string } | null {
  if (c.publishedAt) return { status: 409, code: 'PRICE_LOCKED' };
  if (c.status !== 'draft') return { status: 409, code: 'COURSE_LOCKED' };
  if (c.newPriceAmount > 0 && !c.isVerified) return { status: 403, code: 'INSTRUCTOR_NOT_VERIFIED' };
  if (c.newPriceAmount > 0 && !c.hasPayoutAccount) return { status: 400, code: 'PAYOUT_ACCOUNT_REQUIRED' };
  return null;
}
