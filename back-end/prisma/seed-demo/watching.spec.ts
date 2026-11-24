import { computeRetention } from '../../src/analytics/video-retention.ts';
import { mulberry32 } from './rng.ts';
import { planWatching } from './watching.ts';

const DAY = 86_400_000;
const now = new Date('2026-11-21T00:00:00Z');
let n = 0;
const id = () => `id${++n}`;
const items = [{ id: 'v1', durationSec: 600 }, { id: 'v2', durationSec: 600 }, { id: 'v3', durationSec: 600 }, { id: 'q', durationSec: 0 }, { id: 'v4', durationSec: 600 }];
const enrollments = Array.from({ length: 120 }, (_, i) => ({
  id: `e${i}`, courseId: 'c', at: new Date(now.getTime() - 60 * DAY), completedAt: null, lastAccessedAt: new Date(now.getTime() - 2 * DAY),
}));
// mọi người xong v1..v3 + quiz; người chẵn đang dở v4
const progress = enrollments.flatMap((e, i) =>
  ['v1', 'v2', 'v3', 'q', ...(i % 2 ? ['v4'] : [])].map((itemId, k) => ({ enrollmentId: e.id, itemId, completedAt: new Date(now.getTime() - (40 - k) * DAY) })),
);
const planted = { courseId: 'c', rewatch: { videoIndex: 1, from: 0.45, to: 0.55, share: 0.35 }, drop: { videoIndex: 2, at: 0.6, share: 0.2, jitterSec: 10 } };
const plan = planWatching(mulberry32(7), { now, courses: [{ id: 'c', items }], enrollments, progress, planted, id });
const segsOf = (itemId: string) =>
  plan.segments.filter((s) => s.itemId === itemId).map((s) => ({ learnerId: s.enrollmentId, viewId: s.viewId, s: s.startSec, e: s.endSec, at: s.createdAt.getTime(), seq: s.seq }));

describe('planWatching', () => {
  it('đoạn hợp lệ: trong thời lượng, ≤ 60 s, không trước lúc ghi danh, không sau hiện tại', () => {
    for (const s of plan.segments) {
      expect(s.startSec).toBeGreaterThanOrEqual(0);
      expect(s.endSec).toBeLessThanOrEqual(600);
      expect(s.endSec - s.startSec).toBeGreaterThanOrEqual(1);
      expect(s.endSec - s.startSec).toBeLessThanOrEqual(60);
      expect(s.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
  it('bài đang dở: một dòng chưa xong cho bài video kế tiếp, đoạn xem tới đúng vị trí dở', () => {
    expect(plan.open).toHaveLength(60); // người chẵn
    for (const o of plan.open) {
      expect(o.itemId).toBe('v4');
      const max = Math.max(...plan.segments.filter((s) => s.enrollmentId === o.enrollmentId && s.itemId === 'v4').map((s) => s.endSec));
      expect(max).toBe(o.lastPositionSec);
    }
  });
  it('mẫu cài sẵn được phát hiện; bài đối chứng sạch', () => {
    const v2 = computeRetention(600, segsOf('v2'));
    expect(v2.peaks).toHaveLength(1);
    expect(v2.peaks[0].fromSec).toBeLessThanOrEqual(270 + 5);
    expect(v2.peaks[0].toSec).toBeGreaterThanOrEqual(330 - 5);
    const v3 = computeRetention(600, segsOf('v3'));
    expect(v3.drop).not.toBeNull();
    expect(v3.drop!.fromSec).toBeLessThanOrEqual(360);
    expect(v3.drop!.toSec).toBeGreaterThanOrEqual(350);
    const v1 = computeRetention(600, segsOf('v1'));
    expect(v1.peaks).toEqual([]);
    expect(v1.drop).toBeNull();
  });
});
