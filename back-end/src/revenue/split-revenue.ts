// Luật chia doanh thu: chia trên số tiền học viên thực trả,
// làm tròn xuống cho giảng viên, phần lẻ về platform → CHECK unit = fee + earn luôn đúng.
// Checkout đọc revenue_share_pct một lần cho cả order rồi gọi hàm này cho từng item.
export function splitRevenue(unitPriceAmount: number, sharePct: number) {
  if (!Number.isInteger(unitPriceAmount) || unitPriceAmount < 0) throw new Error('unitPriceAmount không hợp lệ');
  if (!Number.isInteger(sharePct) || sharePct < 0 || sharePct > 100) throw new Error('sharePct không hợp lệ');
  const instructorEarnAmount = Math.floor((unitPriceAmount * sharePct) / 100);
  return { instructorEarnAmount, platformFeeAmount: unitPriceAmount - instructorEarnAmount };
}
