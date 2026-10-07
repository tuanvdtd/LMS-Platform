import { isPeriodEnded, periodEnd } from './period.js';

describe('periodEnd', () => {
  it('= 00:00 ngày 1 tháng sau theo giờ Việt Nam (UTC+7)', () => {
    expect(periodEnd('2026-09').toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(periodEnd('2026-12').toISOString()).toBe('2026-12-31T17:00:00.000Z');
  });
});

describe('isPeriodEnded', () => {
  const now = new Date('2026-10-05T03:00:00Z');
  it('tháng trước → true, tháng hiện tại / tương lai → false', () => {
    expect(isPeriodEnded('2026-09', now)).toBe(true);
    expect(isPeriodEnded('2026-10', now)).toBe(false);
    expect(isPeriodEnded('2027-01', now)).toBe(false);
  });
  it('đúng lúc chuyển tháng giờ VN', () => {
    expect(isPeriodEnded('2026-09', new Date('2026-09-30T16:59:59Z'))).toBe(false);
    expect(isPeriodEnded('2026-09', new Date('2026-09-30T17:00:00Z'))).toBe(true);
  });
});
