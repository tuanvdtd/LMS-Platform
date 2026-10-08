import axios from 'axios';
import { api } from '@/lib/api/client';
import type { BankAccount, EarningsSummary, MyPayout, Paged, PayoutAccountState, VietQrBank } from '@/types/revenue';

// API doanh thu giảng viên (spec 2026-10-05-revenue-share-payout §4.1). Chỉ gọi từ client component.
export const getPayoutAccount = () => api.get<PayoutAccountState>('/instructor/payout-account').then((r) => r.data);

export const savePayoutAccount = (body: BankAccount) =>
  api.put<PayoutAccountState>('/instructor/payout-account', body).then((r) => r.data);

export const getEarningsSummary = () => api.get<EarningsSummary>('/instructor/earnings/summary').then((r) => r.data);

export const listMyPayouts = (page = 1) =>
  api.get<Paged<MyPayout>>('/instructor/payouts', { params: { page } }).then((r) => r.data);

// API công khai của VietQR (R12), gọi thẳng, không qua BE → dùng axios thường, không dùng `api`.
let banksCache: Promise<VietQrBank[]> | null = null;
export function getVietQrBanks() {
  banksCache ??= axios
    .get<{ data: VietQrBank[] }>('https://api.vietqr.io/v2/banks')
    .then((r) => r.data.data)
    .catch((e) => {
      banksCache = null; // lỗi thì lần sau tải lại
      throw e;
    });
  return banksCache;
}
