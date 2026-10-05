import { imageSize } from 'image-size';

// Giới hạn upload (spec curriculum-upload §4.3, video-upload V4). FE dùng cùng số.
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;
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
export function imageInfo(
  buf: Uint8Array,
): { type: ImageExt; width: number; height: number } | null {
  try {
    const { type, width, height } = imageSize(buf);
    if (!type || !EXTS.includes(type) || !width || !height) return null;
    return { type: type as ImageExt, width, height };
  } catch {
    return null;
  }
}

type ReadAt = (offset: number, length: number) => Promise<Buffer>;
const MAX_BOXES = 20; // file độc hại không bắt server đọc mãi
const MOOV_SCAN = 64 * 1024; // mvhd thường là con đầu của moov
const MAX_DURATION_SEC = 24 * 3600; // video bài giảng ≤1 GB, hơn 24 giờ là khai sai

// Thời lượng (giây) từ moov/mvhd, moov ở đầu hay sau mdat đều được (spec video-upload §4.2).
// Box đầu không phải ftyp, hỏng, cắt cụt → null. Chỉ đọc vài header box, không tải cả file.
export async function mp4Duration(
  readAt: ReadAt,
  size: number,
): Promise<number | null> {
  let offset = 0;
  for (let i = 0; i < MAX_BOXES && offset + 8 <= size; i++) {
    const head = await readAt(offset, Math.min(16, size - offset));
    if (head.length < 8) return null;
    const type = head.toString('latin1', 4, 8);
    if (i === 0 && type !== 'ftyp') return null;
    let boxSize = head.readUInt32BE(0);
    let headerSize = 8;
    if (boxSize === 1) {
      if (head.length < 16) return null;
      boxSize = Number(head.readBigUInt64BE(8));
      headerSize = 16;
      if (boxSize < 16) return null;
    } else if (boxSize === 0) {
      boxSize = size - offset;
    } else if (boxSize < 8) {
      return null;
    }
    if (offset + boxSize > size) return null;
    if (type === 'moov') {
      // moov rỗng: không đọc (Range độ dài 0 không hợp lệ, S3 sẽ trả cả object).
      if (boxSize - headerSize < 8) return null;
      return mvhdSeconds(
        await readAt(
          offset + headerSize,
          Math.min(boxSize - headerSize, MOOV_SCAN),
        ),
      );
    }
    offset += boxSize;
  }
  return null;
}

// Offset tính từ đầu payload mvhd (byte 0 = version). fMP4 có duration 0 → trả 0 (spec §4.2). Version lạ, timescale 0, quá 24 giờ → null.
function mvhdSeconds(moov: Buffer): number | null {
  for (let p = 0; p + 8 <= moov.length;) {
    const size = moov.readUInt32BE(p);
    if (size < 8) return null;
    if (moov.toString('latin1', p + 4, p + 8) === 'mvhd') {
      const payload = moov.subarray(p + 8, p + size);
      if (payload[0] > 1) return null;
      const v1 = payload[0] === 1;
      if (payload.length < (v1 ? 32 : 20)) return null;
      const timescale = payload.readUInt32BE(v1 ? 20 : 12);
      const duration = v1
        ? Number(payload.readBigUInt64BE(24))
        : payload.readUInt32BE(16);
      if (!timescale) return null;
      const seconds = Math.round(duration / timescale);
      return seconds <= MAX_DURATION_SEC ? seconds : null;
    }
    p += size;
  }
  return null;
}
