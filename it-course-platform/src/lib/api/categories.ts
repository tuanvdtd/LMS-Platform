import * as Sentry from '@sentry/nextjs';
import type { CategoryNode } from '@/types';
import { IS_BUILD } from './catalog';

// Chỉ chạy ở server. Cache và xử lý lỗi như lib/api/catalog.ts (60s; lỗi lúc chạy ném ra, lúc build trả []).
export async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    // Timeout: BE treo lúc build thì rơi nhanh vào nhánh [] thay vì chờ prerender timeout
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/tree`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`categories/tree ${res.status}`);
    return (await res.json()) as CategoryNode[];
  } catch (err) {
    Sentry.captureException(err);
    if (!IS_BUILD) throw err;
    return [];
  }
}
