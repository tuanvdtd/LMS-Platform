// it-course-platform/src/app/learn/[courseSlug]/_components/learn-nav.ts
import type { LearnItem, LearnItemType, LearnOutline } from '@/types/learn';

const SEGMENT: Partial<Record<LearnItemType, string>> = { lecture: 'lecture', quiz: 'quiz', coding_exercise: 'code' };

// practice_test chưa có trang học → null (mục lục vẫn hiện nhưng không bấm được).
export function itemHref(slug: string, item: Pick<LearnItem, 'id' | 'type'>) {
  const segment = SEGMENT[item.type];
  return segment ? `/learn/${slug}/${segment}/${item.id}` : null;
}

export const flatItems = (o: LearnOutline) => o.sections.flatMap((s) => s.items);

// Bài trước/tiếp theo thứ tự mục lục, bỏ qua bài chưa có trang học.
export function neighbors(o: LearnOutline, itemId: string | undefined) {
  const items = flatItems(o).filter((i) => itemHref(o.course.slug, i));
  const i = items.findIndex((x) => x.id === itemId);
  return { prev: i > 0 ? items[i - 1] : null, next: i >= 0 && i < items.length - 1 ? items[i + 1] : null };
}

// Tổng thời lượng một phần: "48 phút", "1 giờ 5 phút".
export function formatTotal(sec: number) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}`;
}
