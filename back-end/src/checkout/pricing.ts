// Tính giá từng dòng đơn (spec stripe-checkout §5). Hàm thuần, dùng chung cho GET /cart và checkout.
export type PricedCourse = { id: string; instructorId: string; priceAmount: number };
export type CouponPick = { id: string; courseId: string; type: 'fixed_price' | 'free'; priceAmount: number | null };
export type Line = {
  courseId: string;
  instructorId: string;
  couponId: string | null;
  listPriceAmount: number;
  unitPriceAmount: number;
};

// Chỉ coupon fixed_price rẻ hơn giá khoá được áp (P10: coupon free dùng ở trang khoá).
export function priceLines(courses: PricedCourse[], coupons: CouponPick[]): Line[] {
  const byCourse = new Map(coupons.filter((c) => c.type === 'fixed_price').map((c) => [c.courseId, c]));
  return courses.map((c) => {
    const coupon = byCourse.get(c.id);
    const applies = coupon?.priceAmount != null && coupon.priceAmount < c.priceAmount;
    return {
      courseId: c.id,
      instructorId: c.instructorId,
      couponId: applies ? coupon.id : null,
      listPriceAmount: c.priceAmount,
      unitPriceAmount: applies ? coupon.priceAmount! : c.priceAmount,
    };
  });
}

export function summarize(lines: Line[]) {
  const subtotal = lines.reduce((s, l) => s + l.listPriceAmount, 0);
  const total = lines.reduce((s, l) => s + l.unitPriceAmount, 0);
  return { subtotal, discount: subtotal - total, total };
}
