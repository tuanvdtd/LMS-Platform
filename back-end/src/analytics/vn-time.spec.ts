import { vnDate, vnDays, vnMonth, vnMonths, vnMonthToDate, vnWeekStart, vnWeeks, vnWindow } from './vn-time.js';

// 2026-11-24 08:30 giờ VN (thứ Ba) = 01:30 UTC
const now = new Date('2026-11-24T01:30:00Z');

describe('vn-time', () => {
  it('vnWindow: từ 00:00 VN của (hôm nay − (N−1)), kỳ trước liền kề', () => {
    const w = vnWindow(7, now);
    expect(w.from.toISOString()).toBe('2026-11-17T17:00:00.000Z'); // 00:00 VN 18/11
    expect(w.prevFrom.toISOString()).toBe('2026-11-10T17:00:00.000Z');
    expect(vnWindow(1, now).from.toISOString()).toBe('2026-11-23T17:00:00.000Z');
  });
  it('vnDate theo giờ VN (23:30 UTC đã sang ngày mới ở VN)', () => {
    expect(vnDate(new Date('2026-11-23T23:30:00Z'))).toBe('2026-11-24');
  });
  it('vnWeekStart là thứ Hai; vnWeeks kết thúc ở tuần hiện tại', () => {
    expect(vnWeekStart(now)).toBe('2026-11-23');
    expect(vnWeekStart(new Date('2026-11-22T16:59:00Z'))).toBe('2026-11-16'); // 23:59 CN 22/11 VN
    expect(vnWeeks(now, 3)).toEqual(['2026-11-09', '2026-11-16', '2026-11-23']);
  });
  it('vnMonths qua giao thừa', () => {
    expect(vnMonth(now)).toBe('2026-11');
    expect(vnMonths(new Date('2027-01-05T00:00:00Z'), 3)).toEqual(['2026-11', '2026-12', '2027-01']);
  });
  it('vnDays liên tiếp từ from', () => {
    expect(vnDays(vnWindow(3, now).from, 3)).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
  });
  it('vnMonthToDate: cùng số ngày đầu tháng trước, không vượt đầu tháng này', () => {
    const r = vnMonthToDate(now);
    expect(r.monthStart.toISOString()).toBe('2026-10-31T17:00:00.000Z');
    expect(r.prevStart.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(r.prevEnd.getTime() - r.prevStart.getTime()).toBe(now.getTime() - r.monthStart.getTime());
    const late = vnMonthToDate(new Date('2026-03-31T10:00:00Z')); // 31/3: tháng 2 chỉ có 28 ngày
    expect(late.prevEnd.toISOString()).toBe(late.monthStart.toISOString());
  });
});
