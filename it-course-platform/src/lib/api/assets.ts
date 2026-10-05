import { api } from '@/lib/api/client';
import type { AssetKind, LibraryAsset } from '@/types/curriculum';
import type { CourseDetail } from '@/types/instructor-course';

// spec 2026-10-01-curriculum-upload §4.3, 2026-10-02-video-upload §4.3–4.4.
export interface UploadTicket {
  assetId: string | null;
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface CreateUploadPayload {
  kind: 'document' | 'thumbnail' | 'video' | 'promo';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number; // chỉ kind video (spec video-upload V5)
}

export const createUpload = (body: CreateUploadPayload, signal?: AbortSignal) =>
  api.post<UploadTicket>('/instructor/assets/uploads', body, { signal }).then((r) => r.data);

export const completeUpload = (assetId: string, signal?: AbortSignal) =>
  api.post<LibraryAsset>(`/instructor/assets/${assetId}/complete`, undefined, { signal }).then((r) => r.data);

export const listLibrary = (q: string, kind: AssetKind, signal?: AbortSignal) =>
  api
    .get<LibraryAsset[]>('/instructor/assets', { params: q ? { q, kind } : { kind }, signal })
    .then((r) => r.data);

export const getAssetUrl = (assetId: string) =>
  api.get<{ url: string }>(`/instructor/assets/${assetId}/url`).then((r) => r.data);

export const setThumbnail = (courseId: string, key: string) =>
  api.put<CourseDetail>(`/instructor/courses/${courseId}/thumbnail`, { key }).then((r) => r.data);

export const setPromoVideo = (courseId: string, key: string) =>
  api.put<CourseDetail>(`/instructor/courses/${courseId}/promo-video`, { key }).then((r) => r.data);

export const removePromoVideo = (courseId: string) =>
  api.delete<CourseDetail>(`/instructor/courses/${courseId}/promo-video`).then((r) => r.data);
