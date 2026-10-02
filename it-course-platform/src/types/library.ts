// Thư viện file của giảng viên (/instructor/library). Hợp đồng API đề xuất, BE chưa làm:
//   GET    /instructor/assets/library?page&pageSize&q&filter&order → LibraryPage
//   GET    /instructor/assets/:id/usages                         → FileUsage[]
//   DELETE /instructor/assets/:id                                 → 204 (409 nếu đang dùng)
//   GET    /instructor/assets/:id/url?download=1                  → { url } (Content-Disposition: attachment)
// BE coi asset `uploading` quá 1 giờ là `failed` lúc đọc (chưa có cron dọn).

export type FileKind = 'document' | 'video';
export type FileStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type LibraryFilter = 'all' | 'used' | 'unused' | 'failed';
export type SortOrder = 'desc' | 'asc';

export const FILE_KIND_LABEL: Record<FileKind, string> = { document: 'PDF', video: 'Video' };

export const LIBRARY_FILTERS: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'used', label: 'Đang dùng' },
  { key: 'unused', label: 'Chưa dùng' },
  { key: 'failed', label: 'Lỗi' },
];

export const LIBRARY_PAGE_SIZE = 20;

export interface LibraryFile {
  id: string;
  kind: FileKind;
  fileName: string;
  sizeBytes: number;
  status: FileStatus;
  createdAt: string;
  usageCount: number; // số bài giảng (khác nhau) đang dùng: video, PDF chính hoặc tài nguyên
}

export interface LibraryPage {
  items: LibraryFile[];
  total: number; // số file khớp filter + q, để phân trang
  counts: Record<LibraryFilter, number>; // theo q, không theo filter
  totalBytes: number; // cả thư viện
}

export interface FileUsage {
  itemId: string;
  courseId: string;
  courseTitle: string;
  sectionTitle: string;
  lectureTitle: string;
}

export interface LibraryQuery {
  page: number;
  q: string;
  filter: LibraryFilter;
  order: SortOrder;
}
