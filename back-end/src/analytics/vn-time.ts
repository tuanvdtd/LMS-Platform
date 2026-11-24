// Mốc thời gian theo giờ Việt Nam (UTC+7, không giờ mùa hè) cho dashboard giảng viên. Cùng cách tính `rangeBounds` của admin
// (admin/overview-range.ts chỉ nhận 7/30/90 ngày nên không dùng lại được).
const DAY = 86_400_000;
const VN = 7 * 3_600_000;

const dayIndex = (d: Date) => Math.floor((d.getTime() + VN) / DAY); // số ngày VN kể từ 1970-01-01
const startOfDay = (i: number) => new Date(i * DAY - VN); // 00:00 VN của ngày thứ i
const monday = (i: number) => i - ((i + 3) % 7); // 1970-01-01 là thứ Năm

export const vnDate = (d: Date) => new Date(d.getTime() + VN).toISOString().slice(0, 10);
export const vnMonth = (d: Date) => vnDate(d).slice(0, 7);
export const vnWeekStart = (d: Date) => vnDate(startOfDay(monday(dayIndex(d))));

// Cửa sổ N ngày: từ 00:00 VN của (hôm nay − (N−1)) tới lúc gọi; kỳ trước = N ngày liền trước from.
export function vnWindow(days: number, now: Date) {
  const from = startOfDay(dayIndex(now) - (days - 1));
  return { from, prevFrom: new Date(from.getTime() - days * DAY) };
}

export const vnDays = (from: Date, n: number) => Array.from({ length: n }, (_, k) => vnDate(new Date(from.getTime() + k * DAY)));

export function vnWeeks(now: Date, n: number): string[] {
  const m = monday(dayIndex(now));
  return Array.from({ length: n }, (_, k) => vnDate(startOfDay(m - (n - 1 - k) * 7)));
}

export function vnMonths(now: Date, n: number): string[] {
  const [y, m] = vnMonth(now).split('-').map(Number);
  return Array.from({ length: n }, (_, k) => new Date(Date.UTC(y, m - 1 - (n - 1 - k), 1)).toISOString().slice(0, 7));
}

// Tháng này tới lúc gọi so với cùng số ngày đầu tháng trước (không vượt quá đầu tháng này).
export function vnMonthToDate(now: Date) {
  const [y, m] = vnMonth(now).split('-').map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1) - VN);
  const prevStart = new Date(Date.UTC(y, m - 2, 1) - VN);
  const prevEnd = new Date(Math.min(prevStart.getTime() + (now.getTime() - monthStart.getTime()), monthStart.getTime()));
  return { monthStart, prevStart, prevEnd };
}
