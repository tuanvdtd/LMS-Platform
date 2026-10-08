import { priceChangeProblem } from './price-guard.js';

const base = {
  status: 'draft' as const,
  publishedAt: null,
  newPriceAmount: 499_000,
  isVerified: true,
  hasPayoutAccount: true,
};

describe('priceChangeProblem', () => {
  it('nháp chưa từng xuất bản, đủ điều kiện → null', () => {
    expect(priceChangeProblem(base)).toBeNull();
  });

  it('đã từng xuất bản → 409 PRICE_LOCKED (kể cả đang draft)', () => {
    expect(priceChangeProblem({ ...base, publishedAt: new Date() })).toEqual({ status: 409, code: 'PRICE_LOCKED' });
  });

  it('đang chờ duyệt → 409 COURSE_LOCKED', () => {
    expect(priceChangeProblem({ ...base, status: 'in_review' })).toEqual({ status: 409, code: 'COURSE_LOCKED' });
  });

  it('giá > 0, chưa xác minh → 403', () => {
    expect(priceChangeProblem({ ...base, isVerified: false })).toEqual({
      status: 403,
      code: 'INSTRUCTOR_NOT_VERIFIED',
    });
  });

  it('giá > 0, chưa khai ngân hàng → 400', () => {
    expect(priceChangeProblem({ ...base, hasPayoutAccount: false })).toEqual({
      status: 400,
      code: 'PAYOUT_ACCOUNT_REQUIRED',
    });
  });

  it('đặt miễn phí không cần xác minh/ngân hàng', () => {
    expect(priceChangeProblem({ ...base, newPriceAmount: 0, isVerified: false, hasPayoutAccount: false })).toBeNull();
  });
});
