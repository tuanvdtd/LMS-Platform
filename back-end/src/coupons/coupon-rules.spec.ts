import { couponProblems, isCouponActive, vnMonthStart } from './coupon-rules.js';

const NOW = new Date('2026-10-15T03:00:00Z'); // 10:00 giờ VN
const day = 86_400_000;
const base = { coursePriceAmount: 499_000, createdThisMonth: 0, now: NOW };
const fixed = (o = {}) => ({
  code: 'SALE.OCT-26',
  type: 'fixed_price' as const,
  priceAmount: 199_000,
  startsAt: NOW,
  endsAt: new Date(NOW.getTime() + 30 * day),
  ...o,
});
const free = (o = {}) => ({
  code: 'FREEDEMO',
  type: 'free' as const,
  startsAt: NOW,
  endsAt: new Date(NOW.getTime() + 5 * day),
  maxRedemptions: 100,
  ...o,
});
const paths = (input: Parameters<typeof couponProblems>[0], ctx = base) =>
  couponProblems(input, ctx).map((p) => p.path.join('.'));

describe('couponProblems', () => {
  it('hợp lệ → rỗng (mã có dấu chấm)', () => {
    expect(paths(fixed())).toEqual([]);
    expect(paths(free())).toEqual([]);
  });
  it.each([
    [{ priceAmount: undefined }, 'priceAmount'],
    [{ priceAmount: 150_000 }, 'priceAmount'], // không phải bậc giá
    [{ priceAmount: 499_000 }, 'priceAmount'], // không rẻ hơn giá khoá
    [{ endsAt: new Date(NOW.getTime() + 32 * day) }, 'endsAt'],
    [{ endsAt: NOW }, 'endsAt'],
    [{ startsAt: new Date(NOW.getTime() - 3_600_000) }, 'startsAt'],
  ])('fixed_price sai %o → lỗi ở %s', (o, path) => {
    expect(paths(fixed(o))).toContain(path);
  });
  it.each([
    [{ maxRedemptions: undefined }, 'maxRedemptions'],
    [{ endsAt: new Date(NOW.getTime() + 6 * day) }, 'endsAt'],
    [{ priceAmount: 99_000 }, 'priceAmount'],
  ])('free sai %o → lỗi ở %s', (o, path) => {
    expect(paths(free(o))).toContain(path);
  });
  it('đủ 3 coupon trong tháng → lỗi ở gốc', () => {
    expect(paths(fixed(), { ...base, createdThisMonth: 3 })).toContain('');
  });
});

describe('isCouponActive', () => {
  const c = { disabledAt: null, startsAt: NOW, endsAt: new Date(NOW.getTime() + day), maxRedemptions: 2, redeemedCount: 1 };
  it('còn hạn, còn lượt', () => expect(isCouponActive(c, NOW)).toBe(true));
  it('hết lượt', () => expect(isCouponActive({ ...c, redeemedCount: 2 }, NOW)).toBe(false));
  it('đã tắt', () => expect(isCouponActive({ ...c, disabledAt: NOW }, NOW)).toBe(false));
  it('chưa tới giờ', () => expect(isCouponActive(c, new Date(NOW.getTime() - 1))).toBe(false));
  it('không giới hạn lượt', () => expect(isCouponActive({ ...c, maxRedemptions: null, redeemedCount: 9 }, NOW)).toBe(true));
});

describe('vnMonthStart', () => {
  it('đầu tháng theo giờ VN', () => {
    expect(vnMonthStart(NOW).toISOString()).toBe('2026-09-30T17:00:00.000Z');
    // 2026-10-31T18:00Z là 01:00 ngày 1/11 giờ VN
    expect(vnMonthStart(new Date('2026-10-31T18:00:00Z')).toISOString()).toBe('2026-10-31T17:00:00.000Z');
  });
});
