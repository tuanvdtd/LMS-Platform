import { api } from '@/lib/api/client';
import { uploadDocument } from '@/lib/upload';
import type { FileUsage, LibraryPage, LibraryQuery } from '@/types/library';
import { LIBRARY_PAGE_SIZE } from '@/types/library';

type Opts = { signal?: AbortSignal };

export async function listLibraryFiles(query: LibraryQuery, { signal }: Opts = {}): Promise<LibraryPage> {
  const params = { ...query, pageSize: LIBRARY_PAGE_SIZE, q: query.q || undefined };
  return api.get<LibraryPage>('/instructor/assets/library', { params, signal }).then((r) => r.data);
}

export async function getFileUsages(id: string, { signal }: Opts = {}): Promise<FileUsage[]> {
  return api.get<FileUsage[]>(`/instructor/assets/${id}/usages`, { signal }).then((r) => r.data);
}

export async function deleteLibraryFile(id: string): Promise<void> {
  await api.delete(`/instructor/assets/${id}`);
}

export async function getFileUrl(id: string, download = false): Promise<string> {
  const params = download ? { download: 1 } : {};
  return api.get<{ url: string }>(`/instructor/assets/${id}/url`, { params }).then((r) => r.data.url);
}

export async function uploadToLibrary(file: File, options: { onProgress?: (p: number) => void; signal?: AbortSignal }) {
  await uploadDocument(file, options);
}
