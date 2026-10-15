import { priceLines, summarize } from './pricing.js';

const A = { id: 'a', instructorId: 'i1', priceAmount: 499_000 };
const B = { id: 'b', instructorId: 'i2', priceAmount: 299_000 };

describe('priceLines', () => {
  it('không coupon → giá gốc', () => {
    expect(priceLines([A, B], [])).toEqual([
      { courseId: 'a', instructorId: 'i1', couponId: null, listPriceAmount: 499_000, unitPriceAmount: 499_000 },
      { courseId: 'b', instructorId: 'i2', couponId: null, listPriceAmount: 299_000, unitPriceAmount: 299_000 },
    ]);
  });

  it('coupon fixed_price chỉ áp đúng khoá của nó', () => {
    const lines = priceLines([A, B], [{ id: 'c1', courseId: 'a', type: 'fixed_price', priceAmount: 199_000 }]);
    expect(lines[0]).toMatchObject({ couponId: 'c1', unitPriceAmount: 199_000, listPriceAmount: 499_000 });
    expect(lines[1]).toMatchObject({ couponId: null, unitPriceAmount: 299_000 });
  });

  it('1 mã khớp coupon của nhiều khoá → áp cả hai', () => {
    const lines = priceLines([A, B], [
      { id: 'c1', courseId: 'a', type: 'fixed_price', priceAmount: 199_000 },
      { id: 'c4', courseId: 'b', type: 'fixed_price', priceAmount: 99_000 },
    ]);
    expect(lines.map((l) => [l.couponId, l.unitPriceAmount])).toEqual([['c1', 199_000], ['c4', 99_000]]);
  });

  it('coupon free bị bỏ qua (chỉ dùng ở trang khoá — P10)', () => {
    const lines = priceLines([A], [{ id: 'c2', courseId: 'a', type: 'free', priceAmount: null }]);
    expect(lines[0]).toMatchObject({ couponId: null, unitPriceAmount: 499_000 });
  });

  it('coupon không rẻ hơn giá khoá → bỏ qua', () => {
    const lines = priceLines([B], [{ id: 'c3', courseId: 'b', type: 'fixed_price', priceAmount: 299_000 }]);
    expect(lines[0]).toMatchObject({ couponId: null, unitPriceAmount: 299_000 });
  });
});

describe('summarize', () => {
  it('khớp chk_order_amounts: total = subtotal - discount', () => {
    const s = summarize(priceLines([A, B], [{ id: 'c1', courseId: 'a', type: 'fixed_price', priceAmount: 199_000 }]));
    expect(s).toEqual({ subtotal: 798_000, discount: 300_000, total: 498_000 });
  });
});
