import axios from 'axios';
import { createPostUpload } from '@/lib/api/my-posts';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX = 5 * 1024 ** 2;
export const IMAGE_ACCEPT = TYPES.join(',');

// Kiểm ở FE để báo sớm; BE kiểm lại lúc ký URL.
export function imageProblem(file: File): string | null {
  if (!TYPES.includes(file.type)) return 'Chỉ nhận ảnh JPG, PNG hoặc WebP';
  if (file.size > MAX) return 'Ảnh tối đa 5 MB';
  return null;
}

// Ký URL → PUT thẳng lên R2 bằng axios trần (không gửi cookie của BE sang R2) → trả URL công khai để chèn vào bài.
export async function uploadPostImage(file: File, signal?: AbortSignal): Promise<string> {
  const ticket = await createPostUpload({ fileName: file.name, mimeType: file.type, sizeBytes: file.size }, signal);
  await axios.put(ticket.uploadUrl, file, { headers: ticket.headers, signal });
  return ticket.publicUrl;
}
