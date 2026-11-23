import { describe, expect, it } from 'vitest';
import { dailySeries, rangeBounds, vnDate } from './overview-range.js';

describe('rangeBounds', () => {
  it('7d: từ 00:00 giờ VN của 6 ngày trước, kỳ trước dài đúng 7 ngày', () => {
    const r = rangeBounds('7d', new Date('2026-11-23T03:00:00Z')); // 10:00 VN 23/11
    expect(r.days).toBe(7);
    expect(r.from.toISOString()).toBe('2026-11-16T17:00:00.000Z'); // 00:00 VN 17/11
    expect(r.prevFrom.toISOString()).toBe('2026-11-09T17:00:00.000Z');
  });
  it('01:30 sáng VN (vẫn là hôm trước theo UTC) vẫn tính đúng ngày VN', () => {
    expect(rangeBounds('7d', new Date('2026-11-22T18:30:00Z')).from.toISOString()).toBe('2026-11-16T17:00:00.000Z');
  });
  it('30d và 90d', () => {
    expect(rangeBounds('30d', new Date('2026-11-23T03:00:00Z')).days).toBe(30);
    expect(rangeBounds('90d', new Date('2026-11-23T03:00:00Z')).days).toBe(90);
  });
});

describe('vnDate', () => {
  it('đổi mốc UTC sang ngày VN', () => {
    expect(vnDate(new Date('2026-11-16T17:00:00Z'))).toBe('2026-11-17');
    expect(vnDate(new Date('2026-11-16T16:59:59Z'))).toBe('2026-11-16');
  });
});

describe('dailySeries', () => {
  it('gom theo ngày VN, lấp ngày trống bằng 0, đúng thứ tự', () => {
    const from = new Date('2026-11-16T17:00:00Z'); // 00:00 VN 17/11
    const out = dailySeries(
      [
        { paidAt: new Date('2026-11-17T20:00:00Z'), totalAmount: 100, platformFee: 30 }, // 03:00 VN 18/11
        { paidAt: new Date('2026-11-17T16:00:00Z'), totalAmount: 50, platformFee: 15 }, // 23:00 VN 17/11
        { paidAt: new Date('2026-11-18T01:00:00Z'), totalAmount: 200, platformFee: 60 }, // 08:00 VN 18/11
      ],
      from,
      3,
    );
    expect(out).toEqual([
      { date: '2026-11-17', gmv: 50, platformFee: 15 },
      { date: '2026-11-18', gmv: 300, platformFee: 90 },
      { date: '2026-11-19', gmv: 0, platformFee: 0 },
    ]);
  });
});
