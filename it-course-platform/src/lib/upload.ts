import axios from 'axios';
import { completeUpload, createUpload, type CreateUploadPayload } from '@/lib/api/assets';
import type { LibraryAsset } from '@/types/curriculum';

type Options = { onProgress?: (percent: number) => void; signal?: AbortSignal };

// Ký URL → PUT thẳng lên R2 / S3 (spec K4, video-upload V3). axios trần, KHÔNG dùng instance `api`: không gửi cookie/baseURL của BE
// sang R2. Content-Length do trình duyệt tự đặt = file.size (khớp chữ ký). Huỷ bằng AbortSignal.
async function putToStorage(
  file: File,
  kind: CreateUploadPayload['kind'],
  { onProgress, signal }: Options,
  extra?: { durationSec?: number },
) {
  const ticket = await createUpload(
    { kind, fileName: file.name, mimeType: file.type, sizeBytes: file.size, ...extra },
    signal,
  );
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

// Video bài giảng lên S3; thời lượng FE đo gửi kèm, complete = BE kiểm cỡ + cấu trúc MP4 (spec video-upload V5, §4.3).
export async function uploadVideo(file: File, durationSec: number, options: Options = {}): Promise<LibraryAsset> {
  const ticket = await putToStorage(file, 'video', options, { durationSec });
  options.signal?.throwIfAborted();
  return completeUpload(ticket.assetId!, options.signal);
}

// Video giới thiệu lên R2 public; trả key để gắn bằng setPromoVideo (BE kiểm ở bước đó).
export async function uploadPromo(file: File, options: Options = {}): Promise<string> {
  return (await putToStorage(file, 'promo', options)).key;
}

const UNPLAYABLE = 'Trình duyệt không phát được file này. Hãy xuất lại MP4 (H.264)';

// Kiểm ở FE trước khi tải (spec video-upload §5.1): loại, cỡ, trình duyệt đọc được metadata và có hình.
// Thời lượng lấy từ video.duration (làm tròn giây) và gửi lên BE — BE không đo (spec video-upload V5).
export function checkVideo(
  file: File,
  maxBytes: number,
  maxLabel: string,
): Promise<{ problem: string | null; durationSec: number }> {
  if (file.type !== 'video/mp4') return Promise.resolve({ problem: 'Chỉ nhận video MP4', durationSec: 0 });
  if (file.size > maxBytes) return Promise.resolve({ problem: `Video tối đa ${maxLabel}`, durationSec: 0 });
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    // duration đọc trước khi dọn (video.load() reset nó).
    const done = (problem: string | null, duration = 0) => {
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve({ problem, durationSec: problem || !Number.isFinite(duration) ? 0 : Math.round(duration) });
    };
    const timer = setTimeout(() => done(UNPLAYABLE), 10_000);
    video.preload = 'metadata';
    // videoWidth 0 = có tiếng mà không giải mã được hình (vd HEVC trên trình duyệt không hỗ trợ).
    video.onloadedmetadata = () => done(video.videoWidth ? null : UNPLAYABLE, video.duration);
    video.onerror = () => done(UNPLAYABLE);
    video.src = url;
  });
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
