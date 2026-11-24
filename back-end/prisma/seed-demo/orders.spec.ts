import { planShowcaseOrders } from './orders.ts';

describe('planShowcaseOrders', () => {
  it('mỗi ghi danh một đơn paid đúng lúc ghi danh, chia tiền đúng tỉ lệ, không dùng rng', () => {
    let n = 0;
    const at = new Date('2026-10-01T00:00:00Z');
    const r = planShowcaseOrders([{ userId: 'u1', at }, { userId: 'u2', at }], {
      courseId: 'c', instructorId: 'i', priceAmount: 299_000, sharePct: 70, id: () => `id${++n}`,
    });
    expect(r.orders).toHaveLength(2);
    expect(r.orders[0]).toMatchObject({ userId: 'u1', totalAmount: 299_000, paidAt: at });
    expect(r.orders[0].providerSessionId.startsWith('cs_seed_')).toBe(true);
    expect(r.orderItems[0]).toMatchObject({ courseId: 'c', instructorId: 'i', unitPriceAmount: 299_000, listPriceAmount: 299_000, instructorEarnAmount: 209_300, platformFeeAmount: 89_700 });
    expect(r.orderIdByUser.get('u2')).toBe(r.orders[1].id);
  });
});
