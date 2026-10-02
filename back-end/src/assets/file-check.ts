import { imageSize } from 'image-size';

// Giới hạn upload (spec curriculum-upload §4.3). FE dùng cùng số.
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const THUMBNAIL_MIN = { width: 750, height: 422 } as const;
export const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
export type ImageExt = (typeof IMAGE_EXT)[keyof typeof IMAGE_EXT];

const EXTS: readonly string[] = Object.values(IMAGE_EXT);

// Magic bytes: đổi đuôi .exe → .pdf vẫn bị chặn (spec K4).
export function isPdf(buf: Uint8Array): boolean {
  return Buffer.from(buf.subarray(0, 5)).toString('latin1') === '%PDF-';
}

// Loại thật + kích thước từ header ảnh; loại khác, hỏng hoặc image-size ném lỗi → null.
export function imageInfo(buf: Uint8Array): { type: ImageExt; width: number; height: number } | null {
  try {
    const { type, width, height } = imageSize(buf);
    if (!type || !EXTS.includes(type) || !width || !height) return null;
    return { type: type as ImageExt, width, height };
  } catch {
    return null;
  }
}
