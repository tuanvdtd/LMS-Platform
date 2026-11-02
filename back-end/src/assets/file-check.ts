import { imageSize } from 'image-size';

// Giới hạn upload. FE dùng cùng số.
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;
export const THUMBNAIL_MIN = { width: 750, height: 422 } as const;
export const AVATAR_MIN = { width: 200, height: 200 } as const;
export const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
export type ImageExt = (typeof IMAGE_EXT)[keyof typeof IMAGE_EXT];

const EXTS: readonly string[] = Object.values(IMAGE_EXT);

// Magic bytes: đổi đuôi .exe → .pdf vẫn bị chặn.
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

// Ảnh đã đọc từ storage: đúng loại theo đuôi key và đủ kích thước tối thiểu. Lỗi → câu báo cho người dùng.
export function imageProblem(
  buf: Uint8Array,
  ext: string,
  min: { width: number; height: number },
): string | null {
  const info = imageInfo(buf);
  if (!info || info.type !== ext) return 'File không phải ảnh JPG, PNG hoặc WebP';
  if (info.width < min.width || info.height < min.height) return `Ảnh tối thiểu ${min.width}×${min.height} px`;
  return null;
}

type ReadAt = (offset: number, length: number) => Promise<Buffer>;
const MAX_BOXES = 20; // file độc hại không bắt server đọc mãi
const MAX_READS = 150; // file thường: vài box đầu + ~6 lần đọc mỗi trak
const MOOV_SCAN = 64 * 1024; // mvhd thường là con đầu của moov
const MAX_DURATION_SEC = 24 * 3600; // video bài giảng ≤1 GB, hơn 24 giờ là khai sai

type BoxHead = { type: string; start: number; headerSize: number; size: number };

// Header 1 box ở offset (size 32-bit, 64-bit largesize, hoặc 0 = tới end). Hỏng / vượt end → null.
async function boxAt(readAt: ReadAt, offset: number, end: number): Promise<BoxHead | null> {
  if (offset + 8 > end) return null;
  const head = await readAt(offset, Math.min(16, end - offset));
  if (head.length < 8) return null;
  let size = head.readUInt32BE(0);
  let headerSize = 8;
  if (size === 1) {
    if (head.length < 16) return null;
    size = Number(head.readBigUInt64BE(8));
    headerSize = 16;
    if (size < 16) return null;
  } else if (size === 0) {
    size = end - offset;
  } else if (size < 8) {
    return null;
  }
  if (offset + size > end) return null;
  return { type: head.toString('latin1', 4, 8), start: offset, headerSize, size };
}

// Các box con, đọc theo header từng box (không tải payload) — tối đa MAX_BOXES.
async function* children(readAt: ReadAt, parent: BoxHead): AsyncGenerator<BoxHead> {
  const end = parent.start + parent.size;
  let offset = parent.start + parent.headerSize;
  for (let i = 0; i < MAX_BOXES && offset + 8 <= end; i++) {
    const box = await boxAt(readAt, offset, end);
    if (!box) return;
    yield box;
    offset += box.size;
  }
}

// moov ở đầu hay sau mdat đều được. Box đầu không phải ftyp, hỏng, cắt cụt → null.
async function findMoov(readAt: ReadAt, size: number): Promise<BoxHead | null> {
  let i = 0;
  for await (const box of children(readAt, { type: 'file', start: 0, headerSize: 0, size })) {
    if (i++ === 0 && box.type !== 'ftyp') return null;
    if (box.type === 'moov') return box;
  }
  return null;
}

// Thời lượng (giây) từ moov/mvhd. Chỉ đọc vài header box, không tải cả file.
export async function mp4Duration(readAt: ReadAt, size: number): Promise<number | null> {
  const moov = await findMoov(readAt, size);
  // moov rỗng: không đọc (Range độ dài 0 không hợp lệ, S3 sẽ trả cả object).
  if (!moov || moov.size - moov.headerSize < 8) return null;
  return mvhdSeconds(await readAt(moov.start + moov.headerSize, Math.min(moov.size - moov.headerSize, MOOV_SCAN)));
}

export type Mp4Size = { width: number; height: number; hasAudio: boolean };
export const VIDEO_MIN_HEIGHT = 720;

// Kích thước hiển thị (đã tính xoay) của track hình + có track tiếng không.
// Duyệt con của moov theo header từng box: track audio đứng trước có stbl vài trăm KB vẫn tới được track video.
export async function mp4Size(rawReadAt: ReadAt, size: number): Promise<Mp4Size | null> {
  // Mỗi readAt là 1 Range GET: các tầng lồng nhau nhân lên, file độc hại gây hàng nghìn lần đọc. Quá ngân sách → coi như hết dữ liệu.
  let reads = 0;
  const readAt: ReadAt = (offset, length) => (++reads > MAX_READS ? Promise.resolve(Buffer.alloc(0)) : rawReadAt(offset, length));
  const moov = await findMoov(readAt, size);
  if (!moov) return null;
  let dims: { width: number; height: number } | null = null;
  let hasAudio = false;
  for await (const trak of children(readAt, moov)) {
    if (trak.type !== 'trak') continue;
    let tkhd: BoxHead | undefined;
    let mdia: BoxHead | undefined;
    for await (const box of children(readAt, trak)) {
      if (box.type === 'tkhd') tkhd = box;
      else if (box.type === 'mdia') mdia = box;
    }
    // Chỉ track 'vide' mới có kích thước hình; track text/phụ đề/chapter cũng có tkhd khác 0.
    const handler = mdia ? await handlerType(readAt, mdia) : '';
    if (handler === 'vide' && tkhd && !dims) dims = await tkhdDims(readAt, tkhd);
    else if (handler === 'soun') hasAudio = true;
    if (dims && hasAudio) break;
  }
  return dims && { ...dims, hasAudio };
}

// tkhd: matrix 9 × int32 sau phần thời gian (v0 offset 40, v1 offset 52), rồi width/height 16.16.
// Track âm thanh có width/height 0 → null. Xoay 90°/270° (a = 0, b = ±1.0) → đổi chỗ.
async function tkhdDims(readAt: ReadAt, box: BoxHead): Promise<{ width: number; height: number } | null> {
  // tkhd v0 tối thiểu 84 byte payload; ngắn hơn là file hỏng (tránh đọc Range rỗng → 502 thay vì 400).
  if (box.size - box.headerSize < 84) return null;
  const p = await readAt(box.start + box.headerSize, Math.min(box.size - box.headerSize, 96));
  if (p.length < 1 || p[0] > 1) return null;
  const m = p[0] === 1 ? 52 : 40;
  if (p.length < m + 44) return null;
  const width = p.readUInt32BE(m + 36) >>> 16;
  const height = p.readUInt32BE(m + 40) >>> 16;
  if (!width || !height) return null;
  const rotated = p.readInt32BE(m) === 0 && Math.abs(p.readInt32BE(m + 4)) === 0x10000;
  return rotated ? { width: height, height: width } : { width, height };
}

// mdia/hdlr: handler type ở byte 8–11 của payload ('vide' / 'soun' / khác). Thiếu hdlr → ''.
async function handlerType(readAt: ReadAt, mdia: BoxHead): Promise<string> {
  for await (const box of children(readAt, mdia)) {
    if (box.type !== 'hdlr') continue;
    if (box.size - box.headerSize < 12) return '';
    return (await readAt(box.start + box.headerSize, 12)).toString('latin1', 8, 12);
  }
  return '';
}

// Video bài giảng: chỉ ngang, cao ≥ 720 (khung player 16:9; thang HLS thấp nhất là 720/480).
export function videoSizeProblem({ width, height }: { width: number; height: number }): string | null {
  if (width < height) return 'Chỉ nhận video ngang';
  if (height < VIDEO_MIN_HEIGHT) return 'Video phải từ 720p trở lên';
  return null;
}

// Offset tính từ đầu payload mvhd (byte 0 = version). fMP4 có duration 0 → trả 0. Version lạ, timescale 0, quá 24 giờ → null.
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
