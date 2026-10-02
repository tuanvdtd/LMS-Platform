import { api } from '@/lib/api/client';
import { uploadDocument } from '@/lib/upload';
import type { FileUsage, LibraryPage, LibraryQuery } from '@/types/library';
import { LIBRARY_PAGE_SIZE } from '@/types/library';

// ponytail: BE chưa có các endpoint thư viện (hợp đồng ở types/library.ts) → NEXT_PUBLIC_MOCK_LIBRARY=1 dùng
// dữ liệu giả trong library.mock.ts; BE xong thì bỏ biến môi trường và xoá file mock.
const MOCK = process.env.NEXT_PUBLIC_MOCK_LIBRARY === '1';
const mock = () => import('./library.mock');

type Opts = { signal?: AbortSignal };

export async function listLibraryFiles(query: LibraryQuery, { signal }: Opts = {}): Promise<LibraryPage> {
  if (MOCK) return (await mock()).listLibraryFiles(query, signal);
  const params = { ...query, pageSize: LIBRARY_PAGE_SIZE, q: query.q || undefined };
  return api.get<LibraryPage>('/instructor/assets/library', { params, signal }).then((r) => r.data);
}

export async function getFileUsages(id: string, { signal }: Opts = {}): Promise<FileUsage[]> {
  if (MOCK) return (await mock()).getFileUsages(id, signal);
  return api.get<FileUsage[]>(`/instructor/assets/${id}/usages`, { signal }).then((r) => r.data);
}

export async function deleteLibraryFile(id: string): Promise<void> {
  if (MOCK) return (await mock()).deleteLibraryFile(id);
  await api.delete(`/instructor/assets/${id}`);
}

export async function getFileUrl(id: string, download = false): Promise<string> {
  if (MOCK) return 'about:blank';
  const params = download ? { download: 1 } : {};
  return api.get<{ url: string }>(`/instructor/assets/${id}/url`, { params }).then((r) => r.data.url);
}

export async function uploadToLibrary(file: File, options: { onProgress?: (p: number) => void; signal?: AbortSignal }) {
  if (MOCK) return (await mock()).uploadToLibrary(file, options);
  await uploadDocument(file, options);
}
