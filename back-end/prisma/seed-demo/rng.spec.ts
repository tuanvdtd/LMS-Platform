import { mulberry32, int, pick, shuffle, weighted, between, DAY } from './rng.ts';

describe('rng', () => {
  it('cùng seed ra cùng chuỗi', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
  });
  it('int nằm trong [min, max]', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const n = int(r, 3, 8);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(8);
    }
  });
  it('shuffle giữ nguyên phần tử, pick lấy phần tử trong mảng', () => {
    const r = mulberry32(7);
    expect(shuffle(r, [1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
    expect([1, 2, 3]).toContain(pick(r, [1, 2, 3]));
  });
  it('weighted bám theo trọng số', () => {
    const r = mulberry32(9);
    let a = 0;
    for (let i = 0; i < 10_000; i++) if (weighted(r, [['a', 9], ['b', 1]] as const) === 'a') a++;
    expect(a / 10_000).toBeGreaterThan(0.85);
  });
  it('between nằm giữa hai mốc', () => {
    const r = mulberry32(3), x = new Date(0), y = new Date(10 * DAY);
    const d = between(r, x, y);
    expect(d.getTime()).toBeGreaterThanOrEqual(x.getTime());
    expect(d.getTime()).toBeLessThanOrEqual(y.getTime());
  });
});
