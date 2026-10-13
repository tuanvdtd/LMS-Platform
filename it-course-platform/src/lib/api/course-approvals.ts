import { api } from '@/lib/api/client';
import type { AdminApprovalDetail, AdminApprovalRow } from '@/types/course-approval';
import type { ApprovalStatus } from '@/types/instructor-course';
import type { Paged } from '@/types/revenue';

// API admin duyệt khoá (spec pricing-submit-review §5.1). Chỉ gọi từ client component.
const base = '/admin/course-approvals';

export const listApprovals = (params: { status: ApprovalStatus; page: number }) =>
  api.get<Paged<AdminApprovalRow>>(base, { params }).then((r) => r.data);

export const getApproval = (id: string) => api.get<AdminApprovalDetail>(`${base}/${id}`).then((r) => r.data);

export const getApprovalAssetUrl = (id: string, assetId: string) =>
  api.get<{ url: string }>(`${base}/${id}/assets/${assetId}/url`).then((r) => r.data);

export const approveCourse = (id: string) => api.post<AdminApprovalDetail>(`${base}/${id}/approve`).then((r) => r.data);

export const rejectCourse = (id: string, reason: string) =>
  api.post<AdminApprovalDetail>(`${base}/${id}/reject`, { reason }).then((r) => r.data);
