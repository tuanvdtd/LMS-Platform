import { api } from '@/lib/api/client';

// Tách khỏi lib/api/catalog.ts: file đó có 'use cache'/cacheLife (chỉ server), không import được từ client.
// Gọi từ client khi bấm "Xem thử" — URL ký sống 1 giờ, không cache.
export async function getPreviewUrl(slug: string, itemId: string) {
  const { data } = await api.get<{ url: string }>(`/courses/${encodeURIComponent(slug)}/preview/${itemId}`);
  return data.url;
}
