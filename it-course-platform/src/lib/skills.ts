// Helper thuần cho bài đánh giá kỹ năng. Chỉ import tương đối → test bằng node:test.
export type MasteryLevel = 'weak' | 'mid' | 'strong';
export const masteryLevel = (pct: number): MasteryLevel => (pct < 40 ? 'weak' : pct < 70 ? 'mid' : 'strong');
export const MASTERY_LABEL: Record<MasteryLevel, string> = { weak: 'Yếu', mid: 'Trung bình', strong: 'Vững' };
export const MASTERY_COLOR: Record<MasteryLevel, string> = {
  weak: 'var(--skill-weak)', mid: 'var(--skill-mid)', strong: 'var(--skill-strong)',
};
export const DIFFICULTY_LABEL = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' } as const;

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatWait(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  return min < 60 ? `Sau ${min} phút` : `Sau ${Math.ceil(min / 60)} giờ`;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m} phút ${s % 60} giây` : `${s} giây`;
}

// Lớp = độ dài đường tiên quyết dài nhất tới gốc; trong lớp giữ thứ tự `ids` (caller sắp theo tên). Vòng → cắt.
export function layoutSkillGraph(ids: string[], edges: { topicId: string; requiresId: string }[]) {
  const reqs = new Map<string, string[]>();
  for (const e of edges) reqs.set(e.topicId, [...(reqs.get(e.topicId) ?? []), e.requiresId]);
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const layer = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const l = Math.max(-1, ...(reqs.get(id) ?? []).filter((r) => ids.includes(r)).map(layer)) + 1;
    visiting.delete(id);
    memo.set(id, l);
    return l;
  };
  const rows = new Map<number, number>();
  return ids.map((id) => {
    const l = layer(id);
    const row = rows.get(l) ?? 0;
    rows.set(l, row + 1);
    return { id, layer: l, row };
  });
}
