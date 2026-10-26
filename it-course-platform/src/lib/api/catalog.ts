import * as Sentry from '@sentry/nextjs';
import type { CatalogParams, CourseDetail, CourseList, CurriculumSection, PublicInstructor } from '@/types/catalog';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// Data cache của Next chỉ giữ response 200 → 404/lỗi không bị cache, lần sau gọi lại BE.
// 404 → null (trang gọi notFound()); lỗi khác → Sentry + null.
// ponytail: trang tĩnh dựng đúng lúc BE lỗi giữ null/[] tới lần revalidate route (≤ 60s); cần hơn thì gắn tag + revalidateTag.
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    Sentry.captureException(err);
    return null;
  }
}

export async function listCourses(p: CatalogParams & { category?: string; topic?: string; limit?: number }) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') sp.set(k, String(v));
  return fetchJson<CourseList>(`/courses?${sp}`);
}

export async function getCourse(slug: string) {
  return fetchJson<CourseDetail>(`/courses/${encodeURIComponent(slug)}`);
}

export async function getCurriculum(slug: string) {
  const data = await fetchJson<{ sections: CurriculumSection[] }>(`/courses/${encodeURIComponent(slug)}/curriculum`);
  return data?.sections ?? null;
}

export async function getInstructor(id: string) {
  return fetchJson<PublicInstructor>(`/instructors/${encodeURIComponent(id)}`);
}

