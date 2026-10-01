import { api } from '@/lib/api/client';
import type { LibraryAsset } from '@/types/curriculum';
import type { CourseDetail } from '@/types/instructor-course';

// spec 2026-10-01-curriculum-upload §4.3.
export interface UploadTicket {
  assetId: string | null;
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface CreateUploadPayload {
  kind: 'document' | 'thumbnail';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const createUpload = (body: CreateUploadPayload, signal?: AbortSignal) =>
  api.post<UploadTicket>('/instructor/assets/uploads', body, { signal }).then((r) => r.data);

export const completeUpload = (assetId: string, signal?: AbortSignal) =>
  api.post<LibraryAsset>(`/instructor/assets/${assetId}/complete`, undefined, { signal }).then((r) => r.data);

export const listLibrary = (q: string, signal?: AbortSignal) =>
  api.get<LibraryAsset[]>('/instructor/assets', { params: q ? { q } : {}, signal }).then((r) => r.data);

export const getAssetUrl = (assetId: string) =>
  api.get<{ url: string }>(`/instructor/assets/${assetId}/url`).then((r) => r.data);

export const setThumbnail = (courseId: string, key: string) =>
  api.put<CourseDetail>(`/instructor/courses/${courseId}/thumbnail`, { key }).then((r) => r.data);
