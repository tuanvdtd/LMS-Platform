// Thay đổi năng lực đo được trong thời gian học — normalized gain (Hake 1998): g = (sau − trước) / (100 − trước),
// tính trên trung bình lớp; < 0.3 thấp, 0.3–0.7 trung bình, ≥ 0.7 cao. Hàm thuần, KHÔNG import gì; nơi gọi đổi
// rating Elo → % bằng masteryPct (skill-elo.ts). Không khẳng định khoá học là nguyên nhân.
export const SKILL_MIN_GROUP = 5; // dưới ngưỡng không trả số tổng hợp (riêng tư + mẫu quá nhỏ)
export const GAIN_SAME_EPS = 5; // |Δ| ≤ 5 điểm % coi như giữ nguyên

export type GainBand = 'low' | 'medium' | 'high';
export type SkillPoint = { userId: string; at: Date; pct: number }; // lượt đánh giá đã xong: thời điểm + mastery % sau lượt
export type TopicGain = {
  pairs: number;
  prePct: number;
  postPct: number;
  g: number | null;
  band: GainBand | null;
  improved: number;
  same: number;
  declined: number;
};

const round = (x: number, k: number) => Math.round(x * 10 ** k) / 10 ** k;
export const gainBand = (g: number): GainBand => (g < 0.3 ? 'low' : g < 0.7 ? 'medium' : 'high');

export function topicGain(enrollments: { userId: string; enrolledAt: Date }[], points: SkillPoint[]): TopicGain | null {
  const byUser = new Map<string, SkillPoint[]>();
  for (const p of points) {
    const list = byUser.get(p.userId);
    if (list) list.push(p);
    else byUser.set(p.userId, [p]);
  }
  const pairs: [number, number][] = [];
  for (const e of enrollments) {
    const list = (byUser.get(e.userId) ?? []).sort((a, b) => a.at.getTime() - b.at.getTime());
    const pre = list.filter((p) => p.at < e.enrolledAt).at(-1);
    const post = list.filter((p) => p.at > e.enrolledAt).at(-1);
    if (pre && post) pairs.push([pre.pct, post.pct]);
  }
  if (pairs.length < SKILL_MIN_GROUP) return null;
  const prePct = pairs.reduce((s, [a]) => s + a, 0) / pairs.length;
  const postPct = pairs.reduce((s, [, b]) => s + b, 0) / pairs.length;
  const g = prePct >= 100 ? null : (postPct - prePct) / (100 - prePct);
  const delta = pairs.map(([a, b]) => b - a);
  return {
    pairs: pairs.length,
    prePct: round(prePct, 1),
    postPct: round(postPct, 1),
    g: g === null ? null : round(g, 2),
    band: g === null ? null : gainBand(g),
    improved: delta.filter((x) => x > GAIN_SAME_EPS).length,
    same: delta.filter((x) => Math.abs(x) <= GAIN_SAME_EPS).length,
    declined: delta.filter((x) => x < -GAIN_SAME_EPS).length,
  };
}
