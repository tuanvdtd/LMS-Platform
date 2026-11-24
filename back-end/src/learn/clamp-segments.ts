// Đoạn video học viên gửi lên kèm vị trí xem dở. Không báo lỗi khi vượt giới hạn (vị trí xem dở vẫn phải lưu): kẹp về thời lượng,
// bỏ đoạn < 1 s, giữ theo thứ tự tới khi tổng chạm 300 s (nhịp gửi 60 s × tốc độ tối đa 2× × dư 2,5).
export const SEGMENTS_MAX = 20;
export const SEGMENTS_TOTAL_MAX_SEC = 300;

export function clampSegments(segs: readonly { s: number; e: number }[], durationSec: number): { s: number; e: number }[] {
  const out: { s: number; e: number }[] = [];
  let budget = SEGMENTS_TOTAL_MAX_SEC;
  for (const g of segs) {
    if (budget < 1) break;
    const end = Math.min(durationSec > 0 ? Math.min(g.e, durationSec) : g.e, g.s + budget);
    if (end - g.s < 1) continue;
    out.push({ s: g.s, e: end });
    budget -= end - g.s;
  }
  return out;
}
