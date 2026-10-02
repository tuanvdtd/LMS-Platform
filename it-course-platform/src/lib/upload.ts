import axios from 'axios';
import { completeUpload, createUpload } from '@/lib/api/assets';
import type { LibraryAsset } from '@/types/curriculum';

type Options = { onProgress?: (percent: number) => void; signal?: AbortSignal };

// Ký URL → PUT thẳng lên R2 (spec K4). axios trần, KHÔNG dùng instance `api`: không gửi cookie/baseURL của BE
// sang R2. Content-Length do trình duyệt tự đặt = file.size (khớp chữ ký). Huỷ bằng AbortSignal.
async function putToStorage(file: File, kind: 'document' | 'thumbnail', { onProgress, signal }: Options) {
  const ticket = await createUpload({ kind, fileName: file.name, mimeType: file.type, sizeBytes: file.size }, signal);
  await axios.put(ticket.uploadUrl, file, {
    headers: ticket.headers,
    signal,
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / (e.total ?? file.size)) * 100)),
  });
  return ticket;
}

export async function uploadDocument(file: File, options: Options = {}): Promise<LibraryAsset> {
  const ticket = await putToStorage(file, 'document', options);
  options.signal?.throwIfAborted(); // huỷ sau khi PUT xong → không complete (spec §6)
  return completeUpload(ticket.assetId!, options.signal);
}

// Trả key; gắn vào khoá bằng setThumbnail (BE kiểm ảnh ở bước đó).
export async function uploadThumbnail(file: File, options: Options = {}): Promise<string> {
  return (await putToStorage(file, 'thumbnail', options)).key;
}

// Câu báo lỗi cho ô upload; null = người dùng tự huỷ (không hiện gì).
export function uploadErrorMessage(err: unknown): string | null {
  if (axios.isCancel(err) || (err instanceof DOMException && err.name === 'AbortError')) return null;
  const res = axios.isAxiosError(err) ? err.response : undefined;
  const first = (res?.data as { errors?: { message: string }[] } | undefined)?.errors?.[0]?.message;
  if (res?.status === 400 && first) return first;
  if (res?.status === 409) return 'Khoá học đang chờ duyệt, không sửa được';
  if (res?.status === 502) return 'Lưu trữ đang lỗi, thử lại';
  return 'Tải lên thất bại, thử lại';
}
