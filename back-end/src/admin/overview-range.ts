export const RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
export type OverviewRange = keyof typeof RANGES;

const DAY = 86_400_000;
const VN = 7 * 3_600_000; // Asia/Ho_Chi_Minh không có giờ mùa hè

// Kỳ n ngày theo ngày giờ VN: từ 00:00 VN của ngày (hôm nay − (n−1)) đến lúc gọi.
// Kỳ trước = n ngày liền trước from.
export function rangeBounds(range: OverviewRange, now: Date) {
  const days = RANGES[range];
  const todayStart = Math.floor((now.getTime() + VN) / DAY) * DAY - VN;
  const from = new Date(todayStart - (days - 1) * DAY);
  return { days, from, prevFrom: new Date(from.getTime() - days * DAY) };
}

export const vnDate = (d: Date) => new Date(d.getTime() + VN).toISOString().slice(0, 10);

export type DailyPoint = { date: string; gmv: number; platformFee: number };

// Gom đơn theo ngày VN, đủ `days` ngày kể từ `from`, ngày không có đơn = 0.
export function dailySeries(
  orders: { paidAt: Date; totalAmount: number; platformFee: number }[],
  from: Date,
  days: number,
): DailyPoint[] {
  const points = Array.from({ length: days }, (_, i) => ({
    date: vnDate(new Date(from.getTime() + i * DAY)),
    gmv: 0,
    platformFee: 0,
  }));
  const byDate = new Map(points.map((p) => [p.date, p]));
  for (const o of orders) {
    const p = byDate.get(vnDate(o.paidAt));
    if (!p) continue;
    p.gmv += o.totalAmount;
    p.platformFee += o.platformFee;
  }
  return points;
}
