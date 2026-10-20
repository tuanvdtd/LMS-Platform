// Đoạn video đã xem = bitmap, bit i ↔ giây [10i, 10i+10); bit thấp của byte 0 là đoạn 0
// (spec 2026-10-20-lecture-player §4). FE (use-video-progress.ts) dùng cùng BUCKET_SEC.
export const BUCKET_SEC = 10;
const MAX_SPEED = 2; // tốc độ phát tối đa hợp lệ (L5)
const GRACE_SEC = 60; // ân hạn cho lần báo đầu

export const bucketCount = (durationSec: number) => Math.ceil(durationSec / BUCKET_SEC);

export function popcount(bits: Uint8Array): number {
  let n = 0;
  for (let b of bits) for (; b; b &= b - 1) n++;
  return n;
}

const has = (bits: Uint8Array, i: number) => (bits[i >> 3] & (1 << (i & 7))) !== 0;

// Gộp đoạn mới: bỏ số lẻ / ngoài [0, total) / trùng / đã có; nhận tối đa `budget` đoạn mới theo thứ tự tăng dần.
export function mergeBuckets(prev: Uint8Array | null, incoming: number[], total: number, budget: number): Uint8Array<ArrayBuffer> {
  const bits = new Uint8Array(Math.ceil(total / 8));
  if (prev) bits.set(prev.subarray(0, bits.length));
  const fresh = [...new Set(incoming)]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < total && !has(bits, i))
    .sort((a, b) => a - b)
    .slice(0, Math.max(0, budget));
  for (const i of fresh) bits[i >> 3] |= 1 << (i & 7);
  // video bị rút ngắn: prev dài hơn → xoá bit > total ở byte cuối để popcount không đếm dư
  if (total % 8) bits[bits.length - 1] &= (1 << (total % 8)) - 1;
  return bits;
}

// L5: tổng số đoạn ≤ ceil((giây từ lúc bắt đầu xem + 60) × 2 / 10) — trần trên TỔNG nên gửi dồn hay spam đều không
// lách được. elapsedSec tính trong SQL (now() − createdAt) để không lệch đồng hồ DB ↔ Node.
export function watchBudget(elapsedSec: number, watched: number): number {
  return Math.ceil(((Math.max(0, elapsedSec) + GRACE_SEC) * MAX_SPEED) / BUCKET_SEC) - watched;
}

// ≥ 90% số đoạn; tính số nguyên (0.9 * total dính sai số dấu phẩy động).
export const isWatched = (watched: number, total: number) => total > 0 && watched >= Math.ceil((9 * total) / 10);
