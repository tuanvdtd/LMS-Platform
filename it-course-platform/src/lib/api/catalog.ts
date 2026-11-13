import * as Sentry from '@sentry/nextjs';
import type { CatalogParams, CourseDetail, CourseList, CurriculumSection, PublicInstructor } from '@/types/catalog';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
export const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

// Data cache của Next chỉ giữ response 200 → 404/lỗi không bị cache, lần sau gọi lại BE.
// 404 → null (trang gọi notFound()). Lỗi khác → Sentry rồi ném ra: trang tĩnh đang dựng lại thì Next giữ
// bản tốt gần nhất và thử lại ở request sau, thay vì lưu trang rỗng. Riêng lúc build (BE có thể đang tắt)
// trả null để build không hỏng.
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    Sentry.captureException(err);
    if (!IS_BUILD) throw err;
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

// Tiêu đề tab trang học "<tên bài> · <tên khoá>" từ catalog công khai (cache 60s); khoá bị ẩn / lỗi → fallback.
export async function learnItemMetadata(slug: string, itemId: string, fallback: string) {
  const [course, sections] = await Promise.all([getCourse(slug), getCurriculum(slug)]);
  const item = sections?.flatMap((s) => s.items).find((i) => i.id === itemId);
  return { title: item && course ? `${item.title} · ${course.title} | SkillPath` : fallback };
}

export async function getInstructor(id: string) {
  return fetchJson<PublicInstructor>(`/instructors/${encodeURIComponent(id)}`);
}

