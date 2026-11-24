import { splitRevenue } from '../../src/revenue/split-revenue.ts';

// Đơn hàng cho học viên giả lập của khoá trình diễn (khoá có phí): mỗi ghi danh một đơn paid đúng lúc ghi danh.
// Không gọi rng → không xáo luồng rng đã hiệu chỉnh của gói 1.
export function planShowcaseOrders(
  enrollments: readonly { userId: string; at: Date }[],
  a: { courseId: string; instructorId: string; priceAmount: number; sharePct: number; id: () => string },
) {
  const orders: { id: string; userId: string; totalAmount: number; providerSessionId: string; paidAt: Date }[] = [];
  const orderItems: {
    orderId: string; courseId: string; instructorId: string; listPriceAmount: number; unitPriceAmount: number;
    instructorEarnAmount: number; platformFeeAmount: number;
  }[] = [];
  const orderIdByUser = new Map<string, string>();
  for (const e of enrollments) {
    const orderId = a.id();
    orderIdByUser.set(e.userId, orderId);
    orders.push({ id: orderId, userId: e.userId, totalAmount: a.priceAmount, providerSessionId: `cs_seed_${a.id()}`, paidAt: e.at });
    orderItems.push({
      orderId, courseId: a.courseId, instructorId: a.instructorId, listPriceAmount: a.priceAmount, unitPriceAmount: a.priceAmount,
      ...splitRevenue(a.priceAmount, a.sharePct),
    });
  }
  return { orders, orderItems, orderIdByUser };
}
