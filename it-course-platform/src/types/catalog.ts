// Khớp API back-end/src/catalog (spec 2026-10-13-public-catalog §3). File thuần, không import alias → test bằng node:test.
export type SkillLevel = 'all_levels' | 'beginner' | 'intermediate' | 'advanced';
export type CatalogSort = 'newest' | 'popular' | 'price_asc' | 'price_desc';

export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string; // khoá published luôn có ảnh bìa (spec D5)
  priceAmount: number;
  currency: string;
  level: SkillLevel | null;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
  lectureCount: number;
  totalDurationSec: number;
  instructor: { id: string; name: string };
}

export interface CourseList {
  items: CourseCard[];
  total: number;
  page: number;
  limit: number;
  topic: { slug: string; name: string } | null;
}

export interface CourseDetail extends CourseCard {
  description: string | null;
  language: string;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  promoVideoUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  category: { slug: string; name: string; parent: { slug: string; name: string } | null } | null;
  topics: { slug: string; name: string }[];
  instructor: { id: string; name: string; image: string | null; headline: string | null };
}

export interface CurriculumSection {
  id: string;
  title: string;
  items: { id: string; type: 'lecture' | 'quiz' | 'practice_test' | 'coding_exercise'; title: string; durationSec: number; isPreview: boolean }[];
}

export interface PublicInstructor {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  bio: string | null;
  website: string | null;
  socials: { linkedin?: string; github?: string };
  courses: CourseCard[];
}

export interface CatalogParams {
  q?: string;
  level?: SkillLevel;
  price?: 'free' | 'paid';
  sort?: CatalogSort;
  page: number;
}

const LEVELS: SkillLevel[] = ['all_levels', 'beginner', 'intermediate', 'advanced'];
const SORTS: CatalogSort[] = ['newest', 'popular', 'price_asc', 'price_desc'];

export function formatHoursMinutes(sec: number): string {
  const total = sec > 0 ? Math.max(1, Math.round(sec / 60)) : 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} phút`;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

type CurriculumItem = CurriculumSection['items'][number];

export const countItems = (items: CurriculumItem[], type: CurriculumItem['type']) => items.filter((i) => i.type === type).length;

// "5 bài giảng · 1 quiz · 1 bài code · 52 phút" — đếm cả quiz/bài code vì đó là điểm khác biệt của khoá.
export function curriculumSummary(items: CurriculumItem[]): string {
  const parts = [`${countItems(items, 'lecture')} bài giảng`];
  const quiz = countItems(items, 'quiz');
  const code = countItems(items, 'coding_exercise');
  if (quiz) parts.push(`${quiz} quiz`);
  if (code) parts.push(`${code} bài code`);
  if (countItems(items, 'practice_test')) parts.push('kiểm tra cuối khoá');
  const sec = items.reduce((n, i) => n + (i.type === 'lecture' ? i.durationSec : 0), 0);
  if (sec > 0) parts.push(formatHoursMinutes(sec));
  return parts.join(' · ');
}

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string).trim() : undefined);
  const out: CatalogParams = { page: 1 };
  const q = one('q');
  if (q) out.q = q.slice(0, 100);
  const level = one('level');
  if (level && (LEVELS as string[]).includes(level)) out.level = level as SkillLevel;
  const price = one('price');
  if (price === 'free' || price === 'paid') out.price = price;
  const sort = one('sort');
  if (sort && (SORTS as string[]).includes(sort)) out.sort = sort as CatalogSort;
  const page = Number(one('page'));
  if (Number.isInteger(page) && page > 1) out.page = page;
  return out;
}

// Đổi bộ lọc/sort → về trang 1 (trừ khi patch chính là page). Bỏ giá trị mặc định cho URL gọn.
export function catalogHref(base: string, params: CatalogParams, patch: Partial<CatalogParams>): string {
  const next: CatalogParams = { ...params, ...patch, page: patch.page ?? 1 };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.level) sp.set('level', next.level);
  if (next.price) sp.set('price', next.price);
  if (next.sort && next.sort !== 'newest') sp.set('sort', next.sort);
  if (next.page > 1) sp.set('page', String(next.page));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
