// back-end/src/recommendations/recommend-rules.ts
// File này chỉ được `import type`: script đo Precision@K chạy nó trực tiếp bằng node --experimental-strip-types.
import type { Occupation, SkillLevel } from '@prisma/client';

export type TopicRef = { id: string; slug: string; name: string };
export type CandidateCourse = {
  id: string;
  level: SkillLevel | null;
  ratingAvg: number;
  topics: { topicId: string; isPrimary: boolean }[]; // chỉ các topic đang xét (mục tiêu / nghề / đã đo)
};
export type RecommendInput = {
  topics: Map<string, TopicRef>;
  targets: string[]; // topic học viên theo dõi, theo thứ tự thêm
  occupation: { value: Occupation; topicIds: string[] } | null; // topicIds theo position
  userLevel: SkillLevel | null;
  courses: CandidateCourse[]; // đã loại khoá đã ghi danh và khoá của chính học viên
  skills: Map<string, number>; // topicId → % thành thạo; CHỈ topic đã làm bài đánh giá
  prereqs: Map<string, string[]>; // topicId → topic tiên quyết trực tiếp
};
export type Reason =
  | { type: 'gap'; topic: TopicRef; pct: number; blockedTopic?: TopicRef; unmeasuredPrereqs: TopicRef[] }
  | { type: 'goal'; topic: TopicRef }
  | { type: 'occupation'; occupation: Occupation; topics: TopicRef[] };
export type GroupType = Reason['type'];
export type RecPick = { courseId: string; reason: Reason };

export const GROUP_LIMIT = 8;
export const WEAK_PCT = 60; // dưới mức này là topic hụt
export const BEGINNER_PCT = 40; // dưới mức này hợp khoá cơ bản, từ đây tới WEAK_PCT hợp khoá trung cấp

// Nhóm xếp theo thứ tự trong mảng; khoá chỉ nằm ở nhóm đầu tiên khớp.
export function recommend(input: RecommendInput): { type: GroupType; picks: RecPick[] }[] {
  const steps: [GroupType, RecPick[]][] = [
    ['gap', gapPicks(input)],
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

// Mọi topic tiên quyết trực tiếp và gián tiếp. `seen` chặn lặp vô hạn nếu dữ liệu cạnh lỡ tạo vòng.
export function ancestors(topicId: string, prereqs: ReadonlyMap<string, readonly string[]>): string[] {
  const seen = new Set([topicId]);
  const stack = [...(prereqs.get(topicId) ?? [])];
  const out: string[] = [];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    stack.push(...(prereqs.get(id) ?? []));
  }
  return out;
}

export type GapTarget = { topicId: string; pct: number; blockedId?: string };

// Mỗi topic hụt được chuyển về topic tiên quyết hụt sâu nhất của nó (học React khi JavaScript còn yếu thì
// không vào). Topic tiên quyết chưa đo không chặn. Thứ tự trả về: đích của topic hụt nặng nhất trước.
// Chỉ chuyển về topic còn khoá để gợi ý (teachable): gốc hụt mà hết khoá thì lùi lại topic hụt gần nó nhất,
// nếu không mọi lỗ hổng phía sau bị nuốt mất và học viên không thấy gợi ý nào.
export function gapTargets(
  skills: ReadonlyMap<string, number>,
  prereqs: ReadonlyMap<string, readonly string[]>,
  teachable: ReadonlySet<string>,
): GapTarget[] {
  const isWeak = (id: string) => (skills.get(id) ?? 100) < WEAK_PCT;
  const blocks = (id: string) => isWeak(id) && teachable.has(id);
  const byPct = (a: string, b: string) => skills.get(a)! - skills.get(b)! || a.localeCompare(b);
  const targets = new Map<string, GapTarget>();
  for (const t of [...skills.keys()].filter(isWeak).sort(byPct)) {
    const weakAncestors = ancestors(t, prereqs).filter(blocks);
    const roots = weakAncestors.filter((a) => !ancestors(a, prereqs).some(blocks));
    // roots chỉ rỗng khi cạnh tạo vòng; khi đó lấy tạm tổ tiên hụt nặng nhất.
    const target = weakAncestors.length ? [...(roots.length ? roots : weakAncestors)].sort(byPct)[0] : t;
    const g = targets.get(target) ?? { topicId: target, pct: skills.get(target)! };
    // Topic bị chặn = topic hụt nặng nhất dồn về đích này (vòng lặp đi từ hụt nặng tới nhẹ).
    if (target !== t) g.blockedId ??= t;
    targets.set(target, g);
  }
  return [...targets.values()];
}

function gapPicks({ topics, skills, prereqs, courses }: RecommendInput): RecPick[] {
  const teachable = new Set(courses.flatMap((c) => c.topics.map((t) => t.topicId)));
  const queues = gapTargets(skills, prereqs, teachable).map((g) => {
    const fitLevel: SkillLevel = g.pct < BEGINNER_PCT ? 'beginner' : 'intermediate';
    const fits = (c: CandidateCourse) => c.level === fitLevel || c.level === 'all_levels';
    const reason: Reason = {
      type: 'gap',
      topic: topics.get(g.topicId)!,
      pct: g.pct,
      ...(g.blockedId ? { blockedTopic: topics.get(g.blockedId)! } : {}),
      unmeasuredPrereqs: (prereqs.get(g.topicId) ?? []).filter((id) => !skills.has(id)).map((id) => topics.get(id)!),
    };
    return courses
      .flatMap((c) => {
        const t = c.topics.find((x) => x.topicId === g.topicId);
        return t ? [{ c, primary: t.isPrimary }] : [];
      })
      // Khoá lệch mức chỉ xếp sau chứ không loại: topic ít khoá thì vẫn có gợi ý.
      .sort(
        (a, b) =>
          Number(b.primary) - Number(a.primary) ||
          Number(fits(b.c)) - Number(fits(a.c)) ||
          b.c.ratingAvg - a.c.ratingAvg,
      )
      .map(({ c, primary }) => ({ primary, pick: { courseId: c.id, reason } satisfies RecPick }));
  });
  // Xoay vòng giữa các đích để một topic nhiều khoá không chiếm hết chỗ của nhóm. Khoá dạy đúng topic hụt
  // (topic chính) của MỌI đích đi trước; khoá chỉ nhắc tới topic đó như topic phụ xếp sau cùng, vì nó dạy
  // thứ khác là chính (khoá React gắn phụ JavaScript không vá được lỗ hổng JavaScript).
  const picks: RecPick[] = [];
  const used = new Set<string>();
  for (const primary of [true, false]) {
    const qs = queues.map((q) => q.filter((x) => x.primary === primary).map((x) => x.pick));
    for (let more = true; more; ) {
      more = false;
      for (const q of qs) {
        while (q.length && used.has(q[0].courseId)) q.shift();
        const p = q.shift();
        if (!p) continue;
        used.add(p.courseId);
        picks.push(p);
        more = true;
      }
    }
  }
  return picks;
}
