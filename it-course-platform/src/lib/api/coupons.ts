import { api } from '@/lib/api/client';
import type { Coupon, CouponList, CreateCouponPayload } from '@/types/checkout';

export const listCoupons = (courseId: string) =>
  api.get<CouponList>(`/instructor/courses/${courseId}/coupons`).then((r) => r.data);
export const createCoupon = (courseId: string, body: CreateCouponPayload) =>
  api.post<Coupon>(`/instructor/courses/${courseId}/coupons`, body).then((r) => r.data);
export const disableCoupon = (courseId: string, couponId: string) =>
  api.patch<Coupon>(`/instructor/courses/${courseId}/coupons/${couponId}/disable`).then((r) => r.data);
