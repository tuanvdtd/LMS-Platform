// Toán trang cho chế độ Lật sách (page-flip, showCover): trang 0 là bìa đứng một mình, sau đó từng cặp [1,2], [3,4]…

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

/** Trang đầu của cặp kế tiếp / trước đó (khi đã ở đầu hoặc cuối thì giữ nguyên). */
export function nextSpread(i: number, n: number) {
  return hasNextSpread(i, n) ? spreadStart(i) + (spreadStart(i) === 0 ? 1 : 2) : spreadStart(i);
}
export function prevSpread(i: number) {
  const s = spreadStart(i);
  return s <= 1 ? 0 : s - 2;
}

/** Dời sách bao nhiêu bề rộng trang để trang đứng một mình nằm giữa: bìa (bên phải) −½, trang lẻ cuối (bên trái) +½. */
export function bookShift(i: number, n: number) {
  const s = spreadStart(i);
  if (s === 0) return -0.5;
  return s + 1 >= n ? 0.5 : 0;
}

/** Các trang cần có hình: cặp đang mở và hai cặp mỗi bên, để lật nhanh liên tiếp vẫn không gặp trang trắng. */
export function pagesToDraw(i: number, n: number) {
  const s = spreadStart(i);
  const lo = Math.max(0, s - 4);
  const hi = Math.min(n - 1, s + 5);
  // Gần trang đang mở thì vẽ trước.
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).sort((a, b) => Math.abs(a - s - 0.5) - Math.abs(b - s - 0.5));
}

/** Cỡ một trang (px) để hai trang vừa khung w×h, rồi nhân mức phóng. */
export function bookPageSize(w: number, h: number, ratio: number, zoom: number) {
  const fitH = Math.min(h, w / 2 / ratio);
  return { width: Math.floor(fitH * ratio * zoom), height: Math.floor(fitH * zoom) };
}
