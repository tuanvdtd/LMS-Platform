import { itemCompletion } from './course-progress.js';

const DAY = 86_400_000;
const now = Date.parse('2026-11-24T00:00:00Z');
const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
// k học viên ghi danh `age` ngày trước, mỗi người hoàn thành `done` item đầu tiên
const cohort = (k: number, done: number, age = 30) =>
  Array.from({ length: k }, () => ({ enrolledAt: now - age * DAY, completed: new Set(items.slice(0, done).map((x) => x.id)) }));

describe('itemCompletion', () => {
  it('chỉ tính học viên ghi danh ≥ 14 ngày', () => {
    const r = itemCompletion(items, [...cohort(10, 4), ...cohort(30, 0, 3)], now);
    expect(r.n).toBe(10);
    expect(r.rows.map((x) => x.completed)).toEqual([1, 1, 1, 1]);
  });
  it('nút thắt = mức giảm lớn nhất giữa hai item liền nhau (≥ 10 điểm, ≥ 20 người)', () => {
    // 20 xong a; 18 xong b; 8 xong c; 7 xong d → giảm lớn nhất ở c (0,9 → 0,4)
    const r = itemCompletion(items, [...cohort(7, 4), ...cohort(1, 3), ...cohort(10, 2), ...cohort(2, 1)], now);
    expect(r.rows.map((x) => x.completed)).toEqual([1, 0.9, 0.4, 0.35]);
    expect(r.bottleneck).toEqual({ itemId: 'c', completed: 0.4, drop: 0.5 });
  });
  it('dưới 20 người hoặc giảm < 10 điểm → không có nút thắt', () => {
    expect(itemCompletion(items, [...cohort(5, 4), ...cohort(5, 1)], now).bottleneck).toBeNull();
    const smooth = [...cohort(17, 4), ...cohort(1, 3), ...cohort(1, 2), ...cohort(1, 1)];
    expect(itemCompletion(items, smooth, now).bottleneck).toBeNull();
  });
  it('chưa có ai đủ 14 ngày → % là null', () => {
    const r = itemCompletion(items, cohort(5, 2, 1), now);
    expect(r.n).toBe(0);
    expect(r.rows.every((x) => x.completed === null)).toBe(true);
  });
});
