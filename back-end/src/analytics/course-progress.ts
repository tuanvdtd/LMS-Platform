// Tiến độ theo bài: % học viên hoàn thành từng item theo thứ tự curriculum + "nút thắt" (mức giảm lớn nhất giữa hai item liền nhau).
// Mẫu số chỉ gồm người ghi danh ≥ 14 ngày (người mới chưa kịp học, không tạo dốc giả).
// Thuần, không import gì (seed-demo dùng lại).

export const PROGRESS = { minAgeDays: 14, minLearners: 20, bottleneckDrop: 0.1 } as const;
const DAY = 86_400_000;

export type ProgressLearner = { enrolledAt: number; completed: ReadonlySet<string> };
export type ItemCompletion = {
  n: number;
  rows: { id: string; completed: number | null }[];
  bottleneck: { itemId: string; completed: number; drop: number } | null;
};

export function itemCompletion(items: readonly { id: string }[], learners: readonly ProgressLearner[], nowMs: number): ItemCompletion {
  const cutoff = nowMs - PROGRESS.minAgeDays * DAY;
  const pool = learners.filter((l) => l.enrolledAt <= cutoff);
  const n = pool.length;
  const rows = items.map((it) => ({ id: it.id, completed: n ? pool.filter((l) => l.completed.has(it.id)).length / n : null }));
  let bottleneck: ItemCompletion['bottleneck'] = null;
  if (n >= PROGRESS.minLearners) {
    for (let i = 1; i < rows.length; i++) {
      const drop = rows[i - 1].completed! - rows[i].completed!;
      if (drop >= PROGRESS.bottleneckDrop - 1e-9 && (!bottleneck || drop > bottleneck.drop + 1e-9)) {
        bottleneck = { itemId: rows[i].id, completed: rows[i].completed!, drop };
      }
    }
  }
  return { n, rows, bottleneck };
}
