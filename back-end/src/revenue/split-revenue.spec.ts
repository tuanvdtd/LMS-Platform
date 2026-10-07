import { splitRevenue } from './split-revenue.js';

describe('splitRevenue', () => {
  it.each([
    [500_000, 70, 350_000, 150_000],
    [200_000, 70, 140_000, 60_000], // coupon fixed_price 200k
    [99_999, 70, 69_999, 30_000], // làm tròn xuống cho giảng viên
    [0, 70, 0, 0],
    [100_000, 0, 0, 100_000],
    [100_000, 100, 100_000, 0],
  ])('%i đ, %i%% → earn %i, fee %i', (unit, pct, earn, fee) => {
    expect(splitRevenue(unit, pct)).toEqual({ instructorEarnAmount: earn, platformFeeAmount: fee });
  });

  it.each([
    [-1, 70],
    [1.5, 70],
    [100, -1],
    [100, 101],
    [100, 70.5],
  ])('input sai (%s, %s) → ném lỗi', (unit, pct) => {
    expect(() => splitRevenue(unit, pct)).toThrow();
  });
});
