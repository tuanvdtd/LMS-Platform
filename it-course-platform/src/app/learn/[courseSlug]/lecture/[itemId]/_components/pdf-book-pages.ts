// Chế độ Lật sách: trang 0 là bìa đứng riêng, sau đó từng cặp [1,2], [3,4]…

/** Trang đầu của cặp đang mở chứa trang i (đánh số từ 0). */
export function spreadStart(i: number) {
  return i <= 0 ? 0 : i % 2 ? i : i - 1;
}

/** "Trang 4–5/17" khi mở hai trang, "Trang 1/17" ở bìa hoặc trang lẻ cuối. */
export function spreadLabel(i: number, n: number) {
  const s = spreadStart(i);
  return s > 0 && s + 1 < n ? `Trang ${s + 1}–${s + 2}/${n}` : `Trang ${s + 1}/${n}`;
}

export function hasPrevSpread(i: number) {
  return spreadStart(i) > 0;
}

export function hasNextSpread(i: number, n: number) {
  const s = spreadStart(i);
  return s + (s === 0 ? 1 : 2) < n;
}

/** Trang đầu của cặp kế tiếp / trước đó; ở hai đầu thì giữ nguyên. */
export function nextSpread(i: number, n: number) {
  return hasNextSpread(i, n) ? spreadStart(i) + (spreadStart(i) === 0 ? 1 : 2) : spreadStart(i);
}
export function prevSpread(i: number) {
  const s = spreadStart(i);
  return s <= 1 ? 0 : s - 2;
}

/** Độ dời (bề rộng trang) để trang đứng riêng nằm giữa: bìa −½, trang lẻ cuối +½. */
export function bookShift(i: number, n: number) {
  const s = spreadStart(i);
  if (s === 0) return -0.5;
  return s + 1 >= n ? 0.5 : 0;
}

/** Trang cần có hình: cặp đang mở và hai cặp mỗi bên, gần trước xa sau. */
export function pagesToDraw(i: number, n: number) {
  const s = spreadStart(i);
  const lo = Math.max(0, s - 4);
  const hi = Math.min(n - 1, s + 5);
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).sort((a, b) => Math.abs(a - s - 0.5) - Math.abs(b - s - 0.5));
}

/** Cỡ một trang (px) để hai trang vừa khung w×h, nhân mức phóng. */
export function bookPageSize(w: number, h: number, ratio: number, zoom: number) {
  const fitH = Math.min(h, w / 2 / ratio);
  return { width: Math.floor(fitH * ratio * zoom), height: Math.floor(fitH * zoom) };
}
