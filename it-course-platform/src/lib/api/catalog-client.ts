import { api } from '@/lib/api/client';
import type { CourseList } from '@/types/catalog';

// Tách khỏi lib/api/catalog.ts: file đó chỉ chạy ở server (fetch next.revalidate, Sentry server).
// Gọi từ client khi bấm "Xem thử" — URL ký sống 1 giờ, không cache.
export async function getPreviewUrl(slug: string, itemId: string) {
  const { data } = await api.get<{ url: string }>(`/courses/${encodeURIComponent(slug)}/preview/${itemId}`);
  return data.url;
}

// Tab "Khoá học nổi bật" trên trang chủ khách đổi danh mục ở client.
export async function listPopularCourses(category: string) {
  const { data } = await api.get<CourseList>('/courses', { params: { category, sort: 'popular', limit: 8, page: 1 } });
  return data;
}

// Gợi ý dưới ô tìm trên header. signal để huỷ request cũ khi gõ tiếp.
export async function searchCourses(q: string, signal: AbortSignal) {
  const { data } = await api.get<CourseList>('/courses', { params: { q, limit: 6, page: 1 }, signal });
  return data;
}
