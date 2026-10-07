import type { CourseStatus } from '@prisma/client';

export type PriceGuardInput = {
  status: CourseStatus;
  publishedAt: Date | null;
  newPriceAmount: number;
  isVerified: boolean; // có bản ghi instructor_profiles
  hasPayoutAccount: boolean; // instructor_profiles.bankBin khác null
};

// Hợp đồng cho API đặt giá ở đợt 4 (spec revenue-share-payout §3.4, R10, R11). Đợt này chỉ có hàm + test.
// Giá khoá vĩnh viễn từ lần xuất bản đầu (publishedAt chỉ ghi lần duyệt đầu); đổi giá sau đó chỉ bằng coupon.
export function priceChangeProblem(c: PriceGuardInput): { status: 400 | 403 | 409; code: string } | null {
  if (c.publishedAt) return { status: 409, code: 'PRICE_LOCKED' };
  if (c.status !== 'draft') return { status: 409, code: 'COURSE_LOCKED' };
  if (c.newPriceAmount > 0 && !c.isVerified) return { status: 403, code: 'INSTRUCTOR_NOT_VERIFIED' };
  if (c.newPriceAmount > 0 && !c.hasPayoutAccount) return { status: 400, code: 'PAYOUT_ACCOUNT_REQUIRED' };
  return null;
}
