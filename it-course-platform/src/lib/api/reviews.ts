// Đánh giá khoá học. Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { CourseReviewPage, MyReview, OwnReview } from '@/types/reviews';

const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);
const mine = (slug: string) => `/learn/${encodeURIComponent(slug)}/review`;

export const listReviews = (slug: string, params: { rating?: number; cursor?: string }) =>
  data<CourseReviewPage>(api.get(`/courses/${encodeURIComponent(slug)}/reviews`, { params }));
export const getMyReview = (slug: string) => data<MyReview>(api.get(mine(slug)));
export const saveMyReview = (slug: string, body: { rating: number; comment?: string }) =>
  data<OwnReview>(api.put(mine(slug), body));
export const deleteMyReview = (slug: string) => api.delete(mine(slug)).then(() => undefined);
