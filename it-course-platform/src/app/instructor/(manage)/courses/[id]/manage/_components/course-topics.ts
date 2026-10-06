// Chỉ `import type`: file chạy được dưới `node --test` (alias @/ không resolve ở runtime).
import type { CourseTopic, Ref } from '@/types/instructor-course';

export const MAX_TOPICS = 3;

// Topic đầu tiên tự là chủ đề chính (spec 2026-10-06 D3). Trùng hoặc đủ 3 → trả nguyên list.
export function addTopic(list: CourseTopic[], t: Ref): CourseTopic[] {
  if (list.length >= MAX_TOPICS || list.some((x) => x.id === t.id)) return list;
  return [...list, { ...t, isPrimary: list.length === 0 }];
}

// Xoá chủ đề chính → topic đầu còn lại lên thay, để có topic là luôn có chủ đề chính.
export function removeTopic(list: CourseTopic[], id: string): CourseTopic[] {
  const rest = list.filter((x) => x.id !== id);
  if (rest.length && !rest.some((x) => x.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
  return rest;
}

export function setPrimary(list: CourseTopic[], id: string): CourseTopic[] {
  return list.map((x) => ({ ...x, isPrimary: x.id === id }));
}
