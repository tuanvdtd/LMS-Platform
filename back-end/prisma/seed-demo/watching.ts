import type { PrismaClient } from '@prisma/client';
import { DAY, HOUR, addMs, between, chance, int, maxDate, minDate, type Rng } from './rng.ts';

// Đoạn video đã xem cho mọi ghi danh seed, khớp item_progress: bài đã xong → xem gần hết qua 1–3 lần mở (lần sau mở đúng chỗ
// dừng), cắt theo nhịp gửi 60 s như trình phát thật; thỉnh thoảng tua lại ngẫu nhiên một đoạn ngắn; bài video kế tiếp của người
// đang học → dòng item_progress chưa xong + đoạn xem tới vị trí dở. Khoá trình diễn có mẫu cài sẵn (SHOWCASE.video).
// Luồng rng riêng (index.ts) → không xáo dữ liệu đã có.

const CHUNK_SEC = 60;
const MIN = 60_000;

export type PlantedVideo = {
  courseId: string;
  rewatch: { videoIndex: number; from: number; to: number; share: number };
  drop: { videoIndex: number; at: number; share: number; jitterSec: number };
};
export type SegmentRow = {
  id: string; enrollmentId: string; itemId: string; viewId: string; seq: number; startSec: number; endSec: number; createdAt: Date;
};
export type OpenProgress = { enrollmentId: string; itemId: string; lastPositionSec: number; createdAt: Date };
type Item = { id: string; durationSec: number };

export function planWatching(
  rng: Rng,
  a: {
    now: Date;
    courses: readonly { id: string; items: readonly Item[] }[];
    enrollments: readonly { id: string; courseId: string; at: Date; completedAt: Date | null; lastAccessedAt: Date | null }[];
    progress: readonly { enrollmentId: string; itemId: string; completedAt: Date }[];
    planted?: PlantedVideo;
    id: () => string;
  },
) {
  const latest = addMs(a.now, -HOUR);
  const itemsOf = new Map(a.courses.map((c) => [c.id, c.items]));
  const doneOf = new Map<string, Map<string, Date>>();
  for (const p of a.progress) {
    const m = doneOf.get(p.enrollmentId) ?? new Map<string, Date>();
    m.set(p.itemId, p.completedAt);
    doneOf.set(p.enrollmentId, m);
  }
  const segments: SegmentRow[] = [];
  const open: OpenProgress[] = [];

  // Một lần mở trình phát: phát liền [from, to), mỗi lần gửi một đoạn ≤ 60 s.
  const play = (enrollmentId: string, itemId: string, from: number, to: number, start: Date) => {
    const viewId = a.id();
    let t = start;
    for (let s = from; s < to; s += CHUNK_SEC) {
      const e = Math.min(to, s + CHUNK_SEC);
      if (e - s < 1) continue;
      t = minDate(latest, addMs(t, (e - s) * 1000));
      segments.push({ id: a.id(), enrollmentId, itemId, viewId, seq: 0, startSec: s, endSec: e, createdAt: t });
    }
    return t;
  };

  for (const e of a.enrollments) {
    const items = itemsOf.get(e.courseId);
    if (!items) continue;
    const videos = items.filter((x) => x.durationSec > 0);
    const done = doneOf.get(e.id) ?? new Map<string, Date>();
    const p = a.planted?.courseId === e.courseId ? a.planted : undefined;
    const dropper = !!p && chance(rng, p.drop.share);
    const rewatcher = !!p && chance(rng, p.rewatch.share);
    let prevAt = e.at;

    for (const it of items) {
      const doneAt = done.get(it.id);
      if (!doneAt) continue;
      const D = it.durationSec;
      const vi = videos.indexOf(it);
      if (D > 0) {
        const skipIntro = chance(rng, 0.2);
        const start = skipIntro ? Math.round(D * (0.03 + rng() * 0.05)) : 0;
        const isDrop = !!p && dropper && vi === p.drop.videoIndex;
        const end = isDrop
          ? Math.max(start + 1, Math.round(D * p.drop.at + (rng() * 2 - 1) * p.drop.jitterSec))
          : Math.min(D, Math.round(D * (0.93 + rng() * 0.07)));
        const k = int(rng, 1, 3);
        const cuts = [start, ...Array.from({ length: k - 1 }, () => Math.round(start + rng() * (end - start))).sort((x, y) => x - y), end];
        const window0 = maxDate(prevAt, addMs(doneAt, -3 * DAY));
        const starts = Array.from({ length: k }, () => between(rng, window0, doneAt)).sort((x, y) => x.getTime() - y.getTime());
        let last = doneAt;
        for (let j = 0; j < k; j++) last = play(e.id, it.id, cuts[j], cuts[j + 1], minDate(starts[j], addMs(doneAt, -(end - start) * 1000)));
        if (p && rewatcher && vi === p.rewatch.videoIndex) {
          play(e.id, it.id, Math.round(D * p.rewatch.from), Math.round(D * p.rewatch.to), addMs(last, int(rng, 1, 5) * MIN));
        } else if (!isDrop && chance(rng, 0.1)) {
          const len = int(rng, 20, 40);
          const x = Math.round(D * (0.1 + rng() * 0.75));
          if (x + len <= end) play(e.id, it.id, x, x + len, addMs(last, int(rng, 1, 5) * MIN));
        }
      }
      prevAt = doneAt;
    }

    // Bài video kế tiếp của người đang học (đã vào học ít nhất một lần) → đang xem dở.
    if (e.completedAt || !e.lastAccessedAt) continue;
    const next = items.find((x) => !done.has(x.id));
    if (!next || next.durationSec <= 0) continue;
    const pos = Math.max(1, Math.round(next.durationSec * (0.1 + rng() * 0.7)));
    const at = minDate(latest, addMs(e.lastAccessedAt, int(rng, 5, 60) * MIN));
    open.push({ enrollmentId: e.id, itemId: next.id, lastPositionSec: pos, createdAt: at });
    play(e.id, next.id, 0, pos, at);
  }
  return { open, segments };
}

export async function writeWatching(prisma: PrismaClient, plan: ReturnType<typeof planWatching>) {
  await prisma.itemProgress.createMany({
    data: plan.open.map((o) => ({ enrollmentId: o.enrollmentId, itemId: o.itemId, lastPositionSec: o.lastPositionSec, createdAt: o.createdAt })),
  });
  for (let i = 0; i < plan.segments.length; i += 5000) {
    await prisma.videoWatchSegment.createMany({ data: plan.segments.slice(i, i + 5000) });
  }
}
