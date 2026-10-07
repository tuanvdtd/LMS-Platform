import { api } from '@/lib/api/client';
import type { AdminPayoutDetail, AdminPayoutRow, ClosePeriodResult, Paged, PayoutStatus } from '@/types/revenue';

// API admin (spec 2026-10-05-revenue-share-payout §4.2). Chỉ gọi từ client component.
export const getRevenueShare = () =>
  api.get<{ sharePct: number; updatedAt: string }>('/admin/settings/revenue-share').then((r) => r.data);

export const setRevenueShare = (sharePct: number) =>
  api.put<{ sharePct: number; updatedAt: string }>('/admin/settings/revenue-share', { sharePct }).then((r) => r.data);

export const closePeriod = (period: string) =>
  api.post<ClosePeriodResult>('/admin/payouts/close-period', { period }).then((r) => r.data);

export const listPayouts = (params: { page?: number; status?: PayoutStatus; period?: string }) =>
  api.get<Paged<AdminPayoutRow>>('/admin/payouts', { params }).then((r) => r.data);

export const getPayout = (id: string) => api.get<AdminPayoutDetail>(`/admin/payouts/${id}`).then((r) => r.data);

export const markPayoutPaid = (id: string, bankTxnRef: string) =>
  api.post<AdminPayoutDetail>(`/admin/payouts/${id}/mark-paid`, { bankTxnRef }).then((r) => r.data);
