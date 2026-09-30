import * as Sentry from '@sentry/nextjs';
import { cacheLife } from 'next/cache';
import type { CategoryNode } from '@/types';

// Chỉ chạy ở server. Taxonomy hầu như không đổi → cache theo giờ.
// Lỗi: trả [] NGAY TRONG 'use cache' với cacheLife ngắn (spec E10). Bắt ở ngoài thì []
// bị nướng vào static shell lúc build và không có entry nào để revalidate.
export async function getCategoryTree(): Promise<CategoryNode[]> {
  'use cache';
  try {
    // Timeout: BE treo lúc build thì rơi nhanh vào nhánh [] thay vì chờ prerender timeout
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/tree`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`categories/tree ${res.status}`);
    const data = (await res.json()) as CategoryNode[];
    cacheLife('hours');
    return data;
  } catch (err) {
    Sentry.captureException(err);
    cacheLife('minutes');
    return [];
  }
}
