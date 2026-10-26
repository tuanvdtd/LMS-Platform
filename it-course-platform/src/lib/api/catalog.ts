import * as Sentry from '@sentry/nextjs';
import { cacheLife } from 'next/cache';
import type { CatalogParams, CourseDetail, CourseList, CurriculumSection, PublicInstructor } from '@/types/catalog';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// Theo mẫu getCategoryTree: bắt lỗi TRONG 'use cache' + cacheLife ngắn.
// 404 → null (trang gọi notFound()); lỗi khác → Sentry + null, cache 'seconds' để thử lại sớm.
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(5000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    Sentry.captureException(err);
    cacheLife('seconds');
    return null;
  }
}

export async function listCourses(p: CatalogParams & { category?: string; topic?: string; limit?: number }) {
  'use cache';
  cacheLife('minutes');
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') sp.set(k, String(v));
  return fetchJson<CourseList>(`/courses?${sp}`);
}

export async function getCourse(slug: string) {
  'use cache';
  cacheLife('minutes');
  return fetchJson<CourseDetail>(`/courses/${encodeURIComponent(slug)}`);
}

export async function getCurriculum(slug: string) {
  'use cache';
  cacheLife('minutes');
  const data = await fetchJson<{ sections: CurriculumSection[] }>(`/courses/${encodeURIComponent(slug)}/curriculum`);
  return data?.sections ?? null;
}

export async function getInstructor(id: string) {
  'use cache';
  cacheLife('minutes');
  return fetchJson<PublicInstructor>(`/instructors/${encodeURIComponent(id)}`);
}

