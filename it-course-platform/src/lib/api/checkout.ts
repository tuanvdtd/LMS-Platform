import { api } from '@/lib/api/client';
import type { Cart, CouponPreview, CourseBuyStatus, MyEnrollment, MyOrder, SessionOrder } from '@/types/checkout';

// API thanh toán. Chỉ gọi từ client component.
export const getCart = (couponCode?: string) =>
  api.get<Cart>('/cart', { params: couponCode ? { couponCode } : {} }).then((r) => r.data);
export const addToCart = (courseId: string) => api.post(`/cart/${courseId}`);
export const removeFromCart = (courseId: string) => api.delete(`/cart/${courseId}`);

export const getBuyStatus = (courseId: string) =>
  api.get<CourseBuyStatus>(`/me/courses/${courseId}/status`).then((r) => r.data);
export const previewCoupon = (slug: string, code: string) =>
  api.get<CouponPreview>(`/courses/${encodeURIComponent(slug)}/coupons/${encodeURIComponent(code)}`).then((r) => r.data);

export const startCheckout = (key: string, body: { courseId?: string; couponCode?: string }) =>
  api.post<{ url: string }>('/checkout', body, { headers: { 'Idempotency-Key': key } }).then((r) => r.data);
export const enroll = (courseId: string, couponCode?: string) =>
  api.post<{ enrolled: true }>(`/courses/${courseId}/enroll`, couponCode ? { couponCode } : {}).then((r) => r.data);

export const getMyOrders = () => api.get<MyOrder[]>('/me/orders').then((r) => r.data);
export const getOrderBySession = (sessionId: string) =>
  api.get<SessionOrder>(`/me/orders/by-session/${encodeURIComponent(sessionId)}`).then((r) => r.data);
export const getMyEnrollments = () => api.get<MyEnrollment[]>('/me/enrollments').then((r) => r.data);

// Lỗi nghiệp vụ BE có dạng { code, message } → lấy message để toast.
export function apiMessage(e: unknown, fallback = 'Có lỗi xảy ra, thử lại sau') {
  const data = (e as { response?: { data?: { message?: unknown; errors?: { message?: unknown }[] } } }).response?.data;
  const first = data?.errors?.[0]?.message;
  if (typeof first === 'string') return first;
  return typeof data?.message === 'string' ? data.message : fallback;
}
