// Đường giữ chân video, đoạn tua lại nhiều, điểm rời bỏ.
// Căn cứ: Kim, Guo, Seaton, Mitros, Gajos, Miller (L@S 2014) — dữ liệu tương tác theo giây gom thành ô thời gian; đỉnh do xem lại
// là tín hiệu đoạn khó hiểu / quan trọng; rời bỏ đo theo vị trí xa nhất người xem đạt tới.
// Thuần, không import gì: seed-demo (--experimental-strip-types) dùng lại để kiểm chứng mẫu cài sẵn.

export const RETENTION = {
  maxBuckets: 120,
  minBucketSec: 5,
  joinGapSec: 2, // đoạn kế tiếp bắt đầu cách điểm dừng ≤ 2 s = xem tiếp, không phải xem lại
  coverFrac: 0.5, // phủ ô khi phần giao ≥ 50% độ dài ô
  minViewers: 20,
  skipHead: 2, // xem lại từ đầu bài là bình thường
  peakMult: 2,
  peakMin: 0.1,
  peakMinPeople: 5,
  maxPeaks: 3,
  minBase: 0.01, // nền < 1% coi như 0 → không nói "gấp N lần" (chia cho số rất nhỏ ra "gấp 52 lần")
  dropWindowSec: 30,
  dropMin: 0.1,
  tailFrac: 0.1, // bỏ qua phần kết
  finishFrac: 0.9,
} as const;

export type WatchSegment = { learnerId: string; viewId: string; s: number; e: number; at: number; seq: number };
export type RetentionPoint = { t: number; retention: number; stay: number; rewatch: number };
export type RetentionPeak = { fromSec: number; toSec: number; rewatch: number; people: number; multiple: number | null };
export type RetentionDrop = { fromSec: number; toSec: number; lost: number };
export type RetentionResult = {
  bucketSec: number;
  n: number;
  points: RetentionPoint[];
  peaks: RetentionPeak[];
  drop: RetentionDrop | null;
  finished: number | null;
  avgWatched: number | null;
};

export const bucketSize = (durationSec: number) =>
  Math.max(RETENTION.minBucketSec, Math.ceil(durationSec / RETENTION.maxBuckets / 5) * 5);

// Theo từng học viên, theo thứ tự thời gian (at, seq): bỏ đoạn gửi trùng; nối đoạn xem tiếp (kể cả mở lại hôm sau).
export function joinSegments(segs: readonly WatchSegment[]): Map<string, { s: number; e: number }[]> {
  const byLearner = new Map<string, WatchSegment[]>();
  for (const g of segs) {
    const list = byLearner.get(g.learnerId);
    if (list) list.push(g);
    else byLearner.set(g.learnerId, [g]);
  }
  const out = new Map<string, { s: number; e: number }[]>();
  for (const [learnerId, list] of byLearner) {
    list.sort((a, b) => a.at - b.at || a.seq - b.seq);
    const seen = new Set<string>();
    const merged: { s: number; e: number }[] = [];
    for (const g of list) {
      const key = `${g.viewId}|${g.s}|${g.e}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const last = merged.at(-1);
      if (last && Math.abs(g.s - last.e) <= RETENTION.joinGapSec) last.e = Math.max(last.e, g.e);
      else merged.push({ s: g.s, e: g.e });
    }
    out.set(learnerId, merged);
  }
  return out;
}

export function watchedSeconds(segs: readonly WatchSegment[]): number {
  let sum = 0;
  for (const list of joinSegments(segs).values()) for (const g of list) sum += Math.max(0, g.e - g.s);
  return sum;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function computeRetention(durationSec: number, segs: readonly WatchSegment[]): RetentionResult {
  const bs = bucketSize(durationSec);
  const B = durationSec > 0 ? Math.ceil(durationSec / bs) : 0;
  const empty: RetentionResult = { bucketSec: bs, n: 0, points: [], peaks: [], drop: null, finished: null, avgWatched: null };
  if (!B) return empty;

  // Mỗi học viên: số đoạn phủ từng ô + ô xa nhất được phủ.
  const viewers: { count: Int16Array; far: number }[] = [];
  for (const list of joinSegments(segs).values()) {
    const count = new Int16Array(B);
    let far = -1;
    for (const g of list) {
      const s = Math.max(0, g.s);
      const e = Math.min(durationSec, g.e);
      for (let b = Math.floor(s / bs); b < B && b * bs < e; b++) {
        const lo = b * bs;
        const hi = Math.min((b + 1) * bs, durationSec);
        if (Math.min(e, hi) - Math.max(s, lo) >= RETENTION.coverFrac * (hi - lo)) {
          count[b]++;
          if (b > far) far = b;
        }
      }
    }
    if (far >= 0) viewers.push({ count, far });
  }
  const n = viewers.length;
  if (!n) return empty;

  const cov = Array.from({ length: B }, () => 0);
  const re = Array.from({ length: B }, () => 0);
  const stay = Array.from({ length: B }, () => 0);
  let watchedSum = 0;
  let finishedCount = 0;
  for (const v of viewers) {
    let c = 0;
    for (let b = 0; b < B; b++) {
      if (v.count[b] >= 1) {
        cov[b]++;
        c++;
      }
      if (v.count[b] >= 2) re[b]++;
      if (b <= v.far) stay[b]++;
    }
    watchedSum += c / B;
    if (c >= RETENTION.finishFrac * B) finishedCount++;
  }
  const points = cov.map((_, b) => ({ t: b * bs, retention: cov[b] / n, stay: stay[b] / n, rewatch: re[b] / n }));
  const enough = n >= RETENTION.minViewers;
  return {
    bucketSec: bs,
    n,
    points,
    peaks: enough ? findPeaks(points, re, bs, durationSec) : [],
    drop: enough ? findDrop(points, bs, durationSec) : null,
    finished: finishedCount / n,
    avgWatched: watchedSum / n,
  };
}

function findPeaks(points: RetentionPoint[], reCount: number[], bs: number, durationSec: number): RetentionPeak[] {
  const B = points.length;
  const h = RETENTION.skipHead;
  if (B <= h) return [];
  const smooth = points.map((_, b) => {
    let sum = 0;
    let k = 0;
    for (let j = b - 1; j <= b + 1; j++) {
      if (j < 0 || j >= B) continue;
      sum += points[j].rewatch;
      k++;
    }
    return sum / k;
  });
  const base = median(smooth.slice(h));
  const thr = Math.max(RETENTION.peakMult * base, RETENTION.peakMin);
  const found: (RetentionPeak & { score: number })[] = [];
  for (let b = h; b < B; ) {
    if (smooth[b] < thr - 1e-9) {
      b++;
      continue;
    }
    let end = b;
    while (end + 1 < B && smooth[end + 1] >= thr - 1e-9) end++;
    let top = b; // ô có nhiều người xem lại nhất (số thô) trong dãy
    let score = smooth[b];
    for (let j = b; j <= end; j++) {
      if (reCount[j] > reCount[top]) top = j;
      score = Math.max(score, smooth[j]);
    }
    if (reCount[top] >= RETENTION.peakMinPeople) {
      found.push({
        fromSec: b * bs,
        toSec: Math.min((end + 1) * bs, durationSec),
        rewatch: points[top].rewatch,
        people: reCount[top],
        multiple: base >= RETENTION.minBase ? score / base : null,
        score,
      });
    }
    b = end + 1;
  }
  return found
    .sort((x, y) => y.score - x.score)
    .slice(0, RETENTION.maxPeaks)
    .sort((x, y) => x.fromSec - y.fromSec)
    .map(({ score: _score, ...p }) => p);
}

function findDrop(points: RetentionPoint[], bs: number, durationSec: number): RetentionDrop | null {
  const w = Math.max(1, Math.round(RETENTION.dropWindowSec / bs));
  let best: RetentionDrop | null = null;
  for (let b = w; b < points.length; b++) {
    if (b * bs > (1 - RETENTION.tailFrac) * durationSec) break;
    const lost = points[b - w].stay - points[b].stay;
    if (lost >= RETENTION.dropMin - 1e-9 && (!best || lost > best.lost + 1e-9)) best = { fromSec: (b - w) * bs, toSec: b * bs, lost };
  }
  return best;
}
