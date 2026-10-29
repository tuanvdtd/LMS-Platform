import { api } from '@/lib/api/client';
import type {
  AdminApplicationDetail,
  AdminApplicationRow,
  ApplicationView,
  InfoPayload,
  ReviewedStatus,
} from '@/types/instructor-application';
import type { BankAccount, Paged } from '@/types/revenue';

// Đơn giảng viên cao cấp. Chỉ gọi từ client component.
const mine = '/instructor/application';

export const getApplication = () => api.get<ApplicationView>(mine).then((r) => r.data);
export const saveInfo = (body: InfoPayload) => api.put<ApplicationView>(`${mine}/info`, body).then((r) => r.data);
export const saveAvatar = (key: string) => api.put<ApplicationView>(`${mine}/avatar`, { key }).then((r) => r.data);
export const acceptTerms = () => api.put<ApplicationView>(`${mine}/terms`, { accepted: true }).then((r) => r.data);
export const savePayout = (body: BankAccount) => api.put<ApplicationView>(`${mine}/payout`, body).then((r) => r.data);
export const submitApplication = () => api.post<ApplicationView>(`${mine}/submit`).then((r) => r.data);

const admin = '/admin/instructor-applications';

export const listApplications = (params: { status: ReviewedStatus; page: number }) =>
  api.get<Paged<AdminApplicationRow>>(admin, { params }).then((r) => r.data);
export const getApplicationDetail = (id: string) => api.get<AdminApplicationDetail>(`${admin}/${id}`).then((r) => r.data);
export const approveApplication = (id: string) =>
  api.post<AdminApplicationDetail>(`${admin}/${id}/approve`).then((r) => r.data);
export const rejectApplication = (id: string, reason: string) =>
  api.post<AdminApplicationDetail>(`${admin}/${id}/reject`, { reason }).then((r) => r.data);
