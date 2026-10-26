// Hợp đồng API thanh toán (spec 2026-10-15-stripe-checkout §6).
export interface CartCourse { id: string; slug: string; title: string; thumbnailUrl: string | null; instructorName: string }
export interface CartItem { course: CartCourse; listPrice: number; finalPrice: number; couponApplied: boolean }
export interface Cart { items: CartItem[]; summary: { subtotal: number; discount: number; total: number }; couponError?: string }

// BE tính summary bằng tổng giá các dòng → bỏ một dòng thì tự tính lại được, khỏi gọi /cart.
export function withoutCourse(cart: Cart, courseId: string): Cart {
  const items = cart.items.filter((i) => i.course.id !== courseId);
  const subtotal = items.reduce((s, i) => s + i.listPrice, 0);
  const total = items.reduce((s, i) => s + i.finalPrice, 0);
  return { ...cart, items, summary: { subtotal, discount: subtotal - total, total } };
}

export interface CourseBuyStatus { inCart: boolean; enrolled: boolean; isOwner: boolean }
export interface CouponPreview { type: 'fixed_price' | 'free'; priceAmount: number | null }

export interface MyOrder {
  id: string;
  paidAt: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  provider: 'stripe' | 'vnpay';
  items: {
    listPriceAmount: number;
    unitPriceAmount: number;
    coupon: { code: string } | null;
    course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  }[];
}

export interface SessionOrder { id: string; status: 'pending' | 'paid' | 'failed'; items: { course: { slug: string; title: string } }[] }

export interface MyEnrollment {
  createdAt: string;
  progressPct: string;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null; priceAmount: number; instructor: { name: string } };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed_price' | 'free';
  priceAmount: number | null;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number | null;
  redeemedCount: number;
  disabledAt: string | null;
  createdAt: string;
}
export interface CouponList { courseSlug: string; coursePriceAmount: number; items: Coupon[] }
export interface CreateCouponPayload {
  code: string;
  type: 'fixed_price' | 'free';
  priceAmount?: number;
  startsAt: string;
  endsAt: string;
  maxRedemptions?: number;
}

export const COUPON_TYPE_LABEL = { fixed_price: 'Giá cố định', free: 'Miễn phí' } as const;
