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

// Tài khoản moderator do admin quản lý; categories là danh mục cấp 1 được gán.
export type Moderator = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: 'active' | 'locked';
  categories: { id: string; name: string }[];
  reviewedCount: number;
};

export const listModerators = () => api.get<{ items: Moderator[] }>('/admin/moderators').then((r) => r.data.items);

export const createModerator = (body: { name: string; email: string; categoryIds: string[] }) =>
  api.post<Moderator>('/admin/moderators', body).then((r) => r.data);

export const setModeratorCategories = (id: string, categoryIds: string[]) =>
  api.put<Moderator>(`/admin/moderators/${id}/categories`, { categoryIds }).then((r) => r.data);

export const lockModerator = (id: string) => api.post<Moderator>(`/admin/moderators/${id}/lock`).then((r) => r.data);

export const unlockModerator = (id: string) => api.post<Moderator>(`/admin/moderators/${id}/unlock`).then((r) => r.data);

export const resendModeratorInvite = (id: string) =>
  api.post(`/admin/moderators/${id}/resend-invite`).then(() => undefined);
