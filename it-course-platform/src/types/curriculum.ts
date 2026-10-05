import type { ChecklistItem } from './instructor-course';

// Khớp API back-end/src/curriculum + assets (spec curriculum-upload §4, video-upload §4). Giới hạn giống BE.
export const ITEM_TYPE_LABEL = {
  lecture: 'Bài giảng',
  quiz: 'Trắc nghiệm',
  practice_test: 'Bài thi thử',
  coding_exercise: 'Bài tập coding',
} as const;
export type ItemType = keyof typeof ITEM_TYPE_LABEL;

export const MAX_TITLE = 80;
export const MAX_RESOURCES = 10;
export const MIN_PUBLISHED_LECTURES = 5;
export const MIN_VIDEO_MINUTES = 30;
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const THUMBNAIL_MIN = { width: 750, height: 422 } as const;
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;

export interface AssetRef {
  id: string;
  fileName: string;
  sizeBytes: number;
}

export type AssetKind = 'document' | 'video';

export interface LibraryAsset extends AssetRef {
  kind: AssetKind;
  durationSec: number | null;
  createdAt: string;
}

export interface VideoRef extends AssetRef {
  durationSec: number | null;
}

export interface CurriculumItem {
  id: string;
  type: ItemType;
  title: string;
  position: number;
  isPublished: boolean;
  lectureKind: 'video' | 'document' | null;
  description: string | null;
  isPreview: boolean;
  isDownloadable: boolean;
  durationSec: number;
  document: AssetRef | null;
  video: VideoRef | null;
  resources: { id: string; title: string; asset: AssetRef }[];
}

export interface CurriculumSection {
  id: string;
  title: string;
  description: string | null;
  position: number;
  items: CurriculumItem[];
}

export interface CurriculumResponse {
  sections: CurriculumSection[];
  checklist: ChecklistItem[];
}

export interface UpdateItemPayload {
  title?: string;
  description?: string | null;
  isPreview?: boolean;
  isDownloadable?: boolean;
}

export function formatBytes(n: number): string {
  if (n < 1024 ** 2) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(sec: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
