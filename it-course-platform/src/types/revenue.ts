// Khớp response API module revenue (spec 2026-10-05-revenue-share-payout §4).
export type PayoutStatus = 'pending' | 'paid';

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = { pending: 'Chờ trả', paid: 'Đã trả' };

export type BankAccount = { bankBin: string; bankAccountNo: string; bankAccountName: string };
export type PayoutAccountState = { verified: boolean; account: BankAccount | null };

export type EarningsSummary = { sharePct: number; unsettled: number; pending: number; paid: number };

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type MyPayout = {
  id: string;
  period: string;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  bankTxnRef: string | null;
};

export type AdminPayoutRow = {
  id: string;
  period: string;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  instructor: { id: string; name: string; email: string };
};

export type AdminPayoutDetail = AdminPayoutRow &
  BankAccount & {
    bankTxnRef: string | null;
    createdAt: string;
    qrUrl: string | null;
    items: { id: string; unitPriceAmount: number; instructorEarnAmount: number; paidAt: string; course: { id: string; title: string } }[];
  };

export type ClosePeriodResult = {
  created: number;
  updated: number;
  skippedBelowMin: number;
  skippedNoBank: number;
  skippedPaid: number;
};

// Bản ghi trong https://api.vietqr.io/v2/banks (chỉ các trường dùng tới).
export type VietQrBank = { bin: string; shortName: string; name: string; logo: string };

export const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')}₫`;
export const formatPeriod = (p: string) => `Tháng ${Number(p.slice(5))}/${p.slice(0, 4)}`;
