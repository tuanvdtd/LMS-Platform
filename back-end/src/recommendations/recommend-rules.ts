// back-end/src/recommendations/recommend-rules.ts
import type { Occupation, SkillLevel } from '@prisma/client';

export type TopicRef = { id: string; slug: string; name: string };
export type CandidateCourse = {
  id: string;
  level: SkillLevel | null;
  ratingAvg: number;
  topics: { topicId: string; isPrimary: boolean }[]; // chỉ các topic đang xét (mục tiêu / nghề)
};
export type RecommendInput = {
  topics: Map<string, TopicRef>;
  targets: string[]; // topic học viên theo dõi, theo thứ tự thêm
  occupation: { value: Occupation; topicIds: string[] } | null; // topicIds theo position
  userLevel: SkillLevel | null;
  courses: CandidateCourse[]; // đã loại khoá đã ghi danh và khoá của chính học viên
};
export type Reason =
  | { type: 'goal'; topic: TopicRef }
  | { type: 'occupation'; occupation: Occupation; topics: TopicRef[] };
export type GroupType = Reason['type'];
export type RecPick = { courseId: string; reason: Reason };

export const GROUP_LIMIT = 8;

// Nhóm xếp theo thứ tự trong mảng; khoá chỉ nằm ở nhóm đầu tiên khớp. Nhóm mới (vd. theo kết quả
// bài đánh giá kỹ năng) thêm một bước vào mảng này.
export function recommend(input: RecommendInput): { type: GroupType; picks: RecPick[] }[] {
  const steps: [GroupType, RecPick[]][] = [
    ['goal', goalPicks(input)],
    ['occupation', occupationPicks(input)],
  ];
  const used = new Set<string>();
  const groups: { type: GroupType; picks: RecPick[] }[] = [];
  for (const [type, picks] of steps) {
    const kept: RecPick[] = [];
    for (const p of picks) {
      if (used.has(p.courseId) || kept.length === GROUP_LIMIT) continue;
      used.add(p.courseId);
      kept.push(p);
    }
    if (kept.length) groups.push({ type, picks: kept });
  }
  return groups;
}

// Không lọc level: học viên đã tự chọn topic, lọc thêm dễ ra rỗng.
function goalPicks({ topics, targets, courses }: RecommendInput): RecPick[] {
  return targets.flatMap((topicId) =>
    courses
      .flatMap((c) => {
        const t = c.topics.find((x) => x.topicId === topicId);
        return t ? [{ c, primary: t.isPrimary }] : [];
      })
      .sort((a, b) => Number(b.primary) - Number(a.primary) || b.c.ratingAvg - a.c.ratingAvg)
      .map(({ c }) => ({ courseId: c.id, reason: { type: 'goal' as const, topic: topics.get(topicId)! } })),
  );
}

function occupationPicks({ topics, occupation, userLevel, courses }: RecommendInput): RecPick[] {
  if (!occupation) return [];
  const fits = (c: CandidateCourse) => !userLevel || c.level === userLevel || c.level === 'all_levels';
  return courses
    .filter(fits)
    .map((c) => ({ c, matched: occupation.topicIds.filter((id) => c.topics.some((t) => t.topicId === id)) }))
    .filter((x) => x.matched.length)
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        Number(!!userLevel && b.c.level === userLevel) - Number(!!userLevel && a.c.level === userLevel) ||
        b.c.ratingAvg - a.c.ratingAvg,
    )
    .map(({ c, matched }) => ({
      courseId: c.id,
      reason: { type: 'occupation' as const, occupation: occupation.value, topics: matched.map((id) => topics.get(id)!) },
    }));
}
