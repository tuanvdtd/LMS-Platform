const VN_OFFSET_MS = 7 * 3600_000; // Asia/Ho_Chi_Minh không có giờ mùa hè

// Kỳ YYYY-MM kết thúc lúc 00:00 ngày 1 tháng sau giờ VN (spec §3.3). Date.UTC nhận tháng 0-based,
// nên truyền thẳng tháng 1-based = tháng sau.
export function periodEnd(period: string): Date {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
}

export function isPeriodEnded(period: string, now = new Date()): boolean {
  return periodEnd(period).getTime() <= now.getTime();
}
