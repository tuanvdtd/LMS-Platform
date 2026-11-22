import { gainBand, topicGain } from './skill-gain.js';

const d = (day: number) => new Date(Date.UTC(2026, 0, day));
const enroll = (n: number) => Array.from({ length: n }, (_, i) => ({ userId: `u${i}`, enrolledAt: d(10) }));
// Mỗi cặp [trước, sau]: điểm đo ngày 5 (trước ghi danh) và ngày 20 (sau ghi danh).
const pairs = (rows: [number, number][]) =>
  rows.flatMap(([pre, post], i) => [
    { userId: `u${i}`, at: d(5), pct: pre },
    { userId: `u${i}`, at: d(20), pct: post },
  ]);
const same = (n: number, pre: number, post: number) => pairs(Array.from({ length: n }, () => [pre, post] as [number, number]));

describe('topicGain', () => {
  it('g = (sau − trước) / (100 − trước) trên trung bình lớp', () => {
    expect(topicGain(enroll(5), same(5, 40, 70))).toEqual({
      pairs: 5, prePct: 40, postPct: 70, g: 0.5, band: 'medium', improved: 5, same: 0, declined: 0,
    });
  });
  it('dưới 5 cặp → null (riêng tư + mẫu quá nhỏ)', () => {
    expect(topicGain(enroll(4), same(4, 40, 70))).toBeNull();
  });
  it('lấy lượt gần nhất trước ngày ghi danh và lượt mới nhất sau đó; lượt đúng ngày ghi danh không tính', () => {
    const extra = [
      { userId: 'u0', at: d(1), pct: 10 }, // cũ hơn lượt ngày 5 → bị thay
      { userId: 'u0', at: d(30), pct: 90 }, // lượt sau mới nhất
      { userId: 'u9', at: d(10), pct: 50 }, // đúng ngày ghi danh
    ];
    const g = topicGain([...enroll(5), { userId: 'u9', enrolledAt: d(10) }], [...same(5, 40, 70), ...extra])!;
    expect(g.pairs).toBe(5);
    expect(g.postPct).toBe(74); // (90 + 70 × 4) / 5
  });
  it('giữ nguyên trong ±5 điểm, giảm khi tụt hơn 5', () => {
    expect(topicGain(enroll(5), pairs([[50, 53], [50, 46], [50, 50], [50, 40], [50, 70]]))).toMatchObject({
      same: 3, declined: 1, improved: 1,
    });
  });
  it('trước = 100 → không tính được g', () => {
    expect(topicGain(enroll(5), same(5, 100, 100))).toMatchObject({ g: null, band: null });
  });
  it('gainBand theo Hake', () => {
    expect([0.1, 0.3, 0.69, 0.7].map(gainBand)).toEqual(['low', 'medium', 'medium', 'high']);
  });
});
