import { bucketSize, computeRetention, joinSegments, watchedSeconds, type WatchSegment } from './video-retention.js';

let clock = 0;
// Một đoạn xem; mỗi lần gọi tăng `at` → giữ thứ tự thời gian theo thứ tự viết trong test.
const seg = (learnerId: string, s: number, e: number, viewId = `${learnerId}-v1`): WatchSegment => ({ learnerId, viewId, s, e, at: ++clock * 1000, seq: 0 });
const people = (n: number, prefix = 'u') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);
const full = (ids: string[], d: number) => ids.map((id) => seg(id, 0, d));

describe('bucketSize', () => {
  it('tối thiểu 5 s, tối đa ~120 ô, bội số của 5', () => {
    expect(bucketSize(300)).toBe(5);
    expect(bucketSize(600)).toBe(5);
    expect(bucketSize(601)).toBe(10);
    expect(bucketSize(3600)).toBe(30);
  });
});

describe('joinSegments', () => {
  it('nối đoạn bị cắt theo nhịp gửi, giữ đoạn tua lại trong cùng lần mở', () => {
    const m = joinSegments([seg('a', 0, 60), seg('a', 60, 120), seg('a', 120, 200), seg('a', 100, 130), seg('a', 130, 150)]);
    expect(m.get('a')).toEqual([{ s: 0, e: 200 }, { s: 100, e: 150 }]);
  });
  it('mở lại hôm sau tại vị trí xem dở (khác viewId) vẫn nối', () => {
    const m = joinSegments([seg('a', 0, 100, 'v1'), seg('a', 101, 200, 'v2')]);
    expect(m.get('a')).toEqual([{ s: 0, e: 200 }]);
  });
  it('bỏ đoạn gửi trùng (cùng viewId, s, e)', () => {
    const m = joinSegments([seg('a', 0, 60), seg('a', 60, 120), seg('a', 0, 60)]);
    expect(m.get('a')).toEqual([{ s: 0, e: 120 }]);
  });
  it('cùng createdAt thì theo seq', () => {
    const a: WatchSegment = { learnerId: 'a', viewId: 'v', s: 60, e: 120, at: 5, seq: 1 };
    const b: WatchSegment = { learnerId: 'a', viewId: 'v', s: 0, e: 60, at: 5, seq: 0 };
    expect(joinSegments([a, b]).get('a')).toEqual([{ s: 0, e: 120 }]);
  });
  it('watchedSeconds cộng sau khi bỏ trùng', () => {
    expect(watchedSeconds([seg('a', 0, 60), seg('a', 0, 60), seg('b', 10, 20)])).toBe(70);
  });
});

describe('computeRetention', () => {
  it('video 0 s hoặc chưa ai xem → rỗng', () => {
    expect(computeRetention(0, []).n).toBe(0);
    const r = computeRetention(300, []);
    expect(r).toMatchObject({ n: 0, points: [], peaks: [], drop: null, finished: null, avgWatched: null });
  });

  it('20 người xem hết, không tua → giữ chân 100%, không đỉnh, không rời bỏ', () => {
    const r = computeRetention(300, full(people(20), 300));
    expect(r.n).toBe(20);
    expect(r.points).toHaveLength(60);
    expect(r.points.every((p) => p.retention === 1 && p.stay === 1 && p.rewatch === 0)).toBe(true);
    expect(r.peaks).toEqual([]);
    expect(r.drop).toBeNull();
    expect(r.finished).toBe(1);
    expect(r.avgWatched).toBe(1);
  });

  it('8/20 người tua lại 100–140 s → một đỉnh đúng chỗ, nền 0 nên không có bội số', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids, 300), ...ids.slice(0, 8).map((id) => seg(id, 100, 140))]);
    expect(r.peaks).toHaveLength(1);
    const p = r.peaks[0];
    expect(p.fromSec).toBeGreaterThanOrEqual(95);
    expect(p.fromSec).toBeLessThanOrEqual(100);
    expect(p.toSec).toBeGreaterThanOrEqual(140);
    expect(p.toSec).toBeLessThanOrEqual(145);
    expect(p.people).toBe(8);
    expect(p.rewatch).toBeCloseTo(0.4);
    expect(p.multiple).toBeNull();
  });

  it('chỉ 3 người tua lại (15%) → không đủ 5 người, không gắn đỉnh', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids, 300), ...ids.slice(0, 3).map((id) => seg(id, 100, 140))]);
    expect(r.peaks).toEqual([]);
  });

  it('tua lại ngay đầu bài (2 ô đầu) không tính là đỉnh', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids, 300), ...ids.slice(0, 10).map((id) => seg(id, 0, 10))]);
    expect(r.peaks).toEqual([]);
  });

  it('5/20 người dừng ở 150 s → điểm rời bỏ 120–150 s, mất 25%', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids.slice(0, 15), 300), ...ids.slice(15).map((id) => seg(id, 0, 150))]);
    expect(r.drop).toEqual({ fromSec: 120, toSec: 150, lost: 0.25 });
  });

  it('tua tới (bỏ qua 50–100 s) không phải rời bỏ; R có chỗ lõm', () => {
    const ids = people(20);
    const skip = ids.slice(10).flatMap((id) => [seg(id, 0, 50), seg(id, 100, 300)]);
    const r = computeRetention(300, [...full(ids.slice(0, 10), 300), ...skip]);
    expect(r.drop).toBeNull();
    expect(r.points[15].retention).toBe(0.5); // ô 75–80 s
    expect(r.points[15].stay).toBe(1);
  });

  it('dừng trong 10% cuối là bình thường, không gắn điểm rời bỏ', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids.slice(0, 10), 300), ...ids.slice(10).map((id) => seg(id, 0, 280))]);
    expect(r.drop).toBeNull();
  });

  it('xem ≥ 90%: người tua tới cuối rồi xem vài giây không được tính', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids.slice(0, 19), 300), seg(ids[19], 280, 300)]);
    expect(r.finished).toBe(0.95);
  });

  it('đúng 10 điểm % rời bỏ (18/20 xem hết, 2/20 dừng 150 s) vẫn được tính là rời bỏ', () => {
    const ids = people(20);
    const r = computeRetention(300, [...full(ids.slice(0, 18), 300), ...ids.slice(18).map((id) => seg(id, 0, 150))]);
    expect(r.drop).not.toBeNull();
    expect(r.drop!.lost).toBeCloseTo(0.1);
    expect(r.drop!.toSec).toBe(150);
  });

  it('dưới 20 người xem: vẫn có đường cong, không gắn đỉnh / rời bỏ', () => {
    const ids = people(10);
    const r = computeRetention(300, [...full(ids.slice(0, 5), 300), ...ids.slice(5).map((id) => seg(id, 0, 100)), ...ids.map((id) => seg(id, 200, 240))]);
    expect(r.n).toBe(10);
    expect(r.points.length).toBe(60);
    expect(r.peaks).toEqual([]);
    expect(r.drop).toBeNull();
  });
});
