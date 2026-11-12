// Đo Precision@K của gợi ý trên học viên giả lập có điểm yếu biết trước. Thuần: không DB, rng có seed.
// Chạy bằng node --experimental-strip-types nên chỉ import file .ts không phụ thuộc Nest.
import type { Occupation } from '@prisma/client';
import { ancestors, type CandidateCourse, recommend, type TopicRef, WEAK_PCT } from '../../src/recommendations/recommend-rules.ts';
import { masteryPct } from '../../src/skills/skill-elo.ts';
import { int, mulberry32, pick, type Rng, shuffle } from '../seed-demo/rng.ts';
import { planSkillHistory } from '../seed-demo/skills.ts';

export type Q = { id: string; rating: number; answerCount: number; correctCount: number };
export type Catalog = {
  topics: Map<string, TopicRef>;
  prereqs: Map<string, string[]>; // topicId → topic tiên quyết trực tiếp
  courses: CandidateCourse[];
  occupations: { value: Occupation; topicIds: string[] }[]; // mỗi nghề ≥ 2 topic
  questions: Map<string, Q[]>; // chỉ topic đo được
};
export type Learner = {
  id: string;
  ability: Map<string, number>; // năng lực THẬT (thang Elo) ở mọi topic đo được; thuật toán gợi ý không được thấy
  occupation: Catalog['occupations'][number];
  targets: string[];
  measured: string[]; // topic người này đã làm bài đánh giá
};
export type Skills = Map<string, Map<string, number>>; // learnerId → topicId → % đo được

export const SEED = 20261110;
export const LEARNERS = 500;
export const KS = [3, 5, 8] as const;
type K = (typeof KS)[number];
const NOW = new Date('2026-11-10T00:00:00Z');
const ABILITY_MIN = 900;
const ABILITY_MAX = 1700;
const CHILD_HEADROOM = 100; // topic sau giỏi hơn topic tiên quyết tối đa chừng này: ít ai giỏi React mà kém JavaScript

export function makeLearners(catalog: Catalog, n: number, rng: Rng): Learner[] {
  // Topic ít tổ tiên hơn đứng trước → tổ tiên luôn có năng lực trước con cháu.
  const measurable = [...catalog.questions.keys()].sort(
    (a, b) => ancestors(a, catalog.prereqs).length - ancestors(b, catalog.prereqs).length || a.localeCompare(b),
  );
  return Array.from({ length: n }, (_, i) => {
    const ability = new Map<string, number>();
    for (const t of measurable) {
      const caps = ancestors(t, catalog.prereqs).filter((a) => ability.has(a)).map((a) => ability.get(a)! + CHILD_HEADROOM);
      ability.set(t, ABILITY_MIN + rng() * (Math.min(ABILITY_MAX, ...caps) - ABILITY_MIN));
    }
    const occupation = pick(rng, catalog.occupations);
    const targets = shuffle(rng, occupation.topicIds).slice(0, 2);
    const measured = shuffle(rng, measurable).slice(0, int(rng, Math.min(2, measurable.length), measurable.length));
    return { id: `L${i}`, ability, occupation, targets, measured };
  });
}

// Lỗ hổng gốc: topic yếu thật mà mọi topic tiên quyết (trực tiếp, gián tiếp) đều vững thật.
export function rootGaps(ability: ReadonlyMap<string, number>, prereqs: ReadonlyMap<string, readonly string[]>): string[] {
  const weak = (id: string) => ability.has(id) && masteryPct(ability.get(id)!) < WEAK_PCT;
  return [...ability.keys()].filter((t) => weak(t) && !ancestors(t, prereqs).some(weak));
}

// Danh sách ngắn hơn K vẫn chia K: gợi ý thiếu cũng là gợi ý kém.
export const precisionAtK = (list: readonly string[], relevant: ReadonlySet<string>, k: number): number =>
  list.slice(0, k).filter((id) => relevant.has(id)).length / k;

// Cho học viên làm bài đánh giá qua đúng engine Elo. attempts bỏ trống = ngẫu nhiên 1–3 lượt mỗi topic.
export function measureSkills(catalog: Catalog, learners: readonly Learner[], attempts: number | undefined, rng: Rng): Skills {
  const plan = planSkillHistory(
    {
      now: NOW,
      learners: learners.flatMap((l) =>
        l.measured.map((topicId) => ({ userId: l.id, topicId, ability: l.ability.get(topicId)!, attempts })),
      ),
      questions: catalog.questions,
    },
    rng,
  );
  const out: Skills = new Map();
  for (const s of plan.skills) out.set(s.userId, (out.get(s.userId) ?? new Map<string, number>()).set(s.topicId, masteryPct(s.rating)));
  return out;
}

// prereqs là đồ thị ĐƯA CHO thuật toán (rỗng = tắt đồ thị); lỗ hổng gốc luôn tính bằng đồ thị thật của catalog.
export function evaluate(catalog: Catalog, learners: readonly Learner[], skills: Skills, prereqs: Map<string, string[]>) {
  const sum: Record<K, number> = { 3: 0, 5: 0, 8: 0 };
  let eligible = 0;
  for (const l of learners) {
    const gaps = new Set(rootGaps(l.ability, catalog.prereqs));
    const relevant = new Set(
      catalog.courses.filter((c) => c.topics.some((t) => t.isPrimary && gaps.has(t.topicId))).map((c) => c.id),
    );
    // Không có khoá nào có thể trúng → precision vô nghĩa, loại khỏi trung bình.
    if (!relevant.size) continue;
    eligible++;
    const list = recommend({
      topics: catalog.topics,
      targets: l.targets,
      occupation: l.occupation,
      userLevel: null,
      courses: catalog.courses,
      skills: skills.get(l.id) ?? new Map(),
      prereqs,
    }).flatMap((g) => g.picks.map((p) => p.courseId));
    for (const k of KS) sum[k] += precisionAtK(list, relevant, k);
  }
  const avg = (k: K) => (eligible ? sum[k] / eligible : 0);
  return { p: { 3: avg(3), 5: avg(5), 8: avg(8) } as Record<K, number>, eligible, excluded: learners.length - eligible };
}

export function runEval(catalog: Catalog, n = LEARNERS, seed = SEED) {
  // Một quần thể học viên dùng chung cho mọi dòng; mỗi lần đo khởi tạo lại rng để các dòng so được với nhau.
  const learners = makeLearners(catalog, n, mulberry32(seed));
  const measure = (attempts?: number) => measureSkills(catalog, learners, attempts, mulberry32(seed + 1));
  const mixed = measure();
  const pairs = learners.flatMap((l) => [...l.ability.values()]);
  const withGraph = evaluate(catalog, learners, mixed, catalog.prereqs);
  return {
    learners: n,
    eligible: withGraph.eligible,
    excluded: withGraph.excluded,
    weakShare: pairs.filter((a) => masteryPct(a) < WEAK_PCT).length / pairs.length,
    table1: [
      { name: 'Chỉ mục tiêu + nghề (mốc nền)', p: evaluate(catalog, learners, new Map(), catalog.prereqs).p },
      { name: 'Thêm lỗ hổng, không dùng đồ thị tiên quyết', p: evaluate(catalog, learners, mixed, new Map()).p },
      { name: 'Thêm lỗ hổng, có đồ thị tiên quyết', p: withGraph.p },
    ],
    table2: [1, 2, 3].map((attempts) => ({ attempts, p5: evaluate(catalog, learners, measure(attempts), catalog.prereqs).p[5] })),
  };
}
