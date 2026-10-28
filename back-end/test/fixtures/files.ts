// Buffer tối thiểu đủ để isPdf / image-size nhận dạng. Không phải file mở được.
const u16 = (n: number) => [n >> 8, n & 255];
const u32 = (n: number) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const u32le = (n: number) => u32(n).reverse();
const u24le = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];
const ascii = (s: string) => [...Buffer.from(s, 'latin1')];

export const pdf = Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n%%EOF\n', 'latin1');

// File thực thi Windows đổi đuôi .pdf / .png.
export const exe = Buffer.from([...ascii('MZ'), 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);

export const png = (w: number, h: number) =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...u32(13), ...ascii('IHDR'), ...u32(w), ...u32(h), 8, 2, 0, 0, 0, 0, 0, 0, 0]);

// SOI + APP0 (JFIF) + SOF0 + EOI.
export const jpg = (w: number, h: number) =>
  Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, ...u16(16), ...ascii('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, ...u16(17), 8, ...u16(h), ...u16(w), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
    0xff, 0xd9,
  ]);

// RIFF/WEBP với chunk VP8X (kích thước canvas - 1, 24 bit LE).
export const webp = (w: number, h: number) => {
  const body = [...ascii('WEBP'), ...ascii('VP8X'), ...u32le(10), 0, 0, 0, 0, ...u24le(w - 1), ...u24le(h - 1)];
  return Buffer.from([...ascii('RIFF'), ...u32le(body.length), ...body]);
};

// MP4 tối thiểu cho mp4Duration / mp4Size: ftyp + moov(mvhd + trak) + mdat, không phát được.
const u64 = (n: number) => [...u32(Math.floor(n / 2 ** 32)), ...u32(n >>> 0)];
export const box = (type: string, payload: number[] | Buffer) => {
  const body = [...payload];
  return Buffer.from([...u32(8 + body.length), ...ascii(type), ...body]);
};
const ftyp = box('ftyp', [...ascii('isom'), ...u32(512), ...ascii('isomiso2avc1mp41')]);
export const mvhd = (seconds: number, { timescale = 1000, version = 0 } = {}) => {
  const duration = seconds * timescale;
  const head =
    version === 1
      ? [1, 0, 0, 0, ...u64(0), ...u64(0), ...u32(timescale), ...u64(duration)]
      : [0, 0, 0, 0, ...u32(0), ...u32(0), ...u32(timescale), ...u32(duration)];
  return box('mvhd', [...head, ...Array.from({ length: 80 }, () => 0)]);
};
// tkhd v0: 84 byte payload; matrix 9 × int32 ở offset 40, width/height 16.16 ở offset 76/80. Video volume 0, audio 0x0100.
const tkhd = (width: number, height: number, rotate: 0 | 90 | 270 = 0) => {
  const matrix =
    rotate === 90 ? [0, 0x10000, 0, -0x10000, 0, 0, 0, 0, 0x40000000]
    : rotate === 270 ? [0, -0x10000, 0, 0x10000, 0, 0, 0, 0, 0x40000000]
    : [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000];
  return box('tkhd', [
    0, 0, 0, 3, ...u32(0), ...u32(0), ...u32(1), ...u32(0), ...u32(0),
    ...Array.from({ length: 8 }, () => 0), 0, 0, 0, 0, ...(width ? [0, 0] : [1, 0]), 0, 0,
    ...matrix.flatMap(u32), ...u32(width * 65536), ...u32(height * 65536),
  ]);
};
type Handler = 'vide' | 'soun' | 'text';
const hdlr = (handler: Handler) =>
  box('hdlr', [0, 0, 0, 0, ...u32(0), ...ascii(handler), ...Array.from({ length: 13 }, () => 0)]);
// minf giả cỡ tuỳ ý: mô phỏng stbl lớn đẩy track sau ra ngoài 64 KB đầu của moov.
const trak = (head: Buffer, handler: Handler, minfBytes = 8) =>
  box('trak', Buffer.concat([head, box('mdia', Buffer.concat([hdlr(handler), box('minf', Buffer.alloc(minfBytes))]))]));

type Dims = { width: number; height: number; rotate?: 0 | 90 | 270 };
type Mp4Options = {
  timescale?: number;
  version?: number;
  moovLast?: boolean;
  largeMdat?: boolean;
  video?: Dims | null; // null = không có track hình
  audio?: boolean;
  textFirst?: boolean; // track phụ đề (tkhd 640×480 khác 0) đứng trước track hình
  audioFirst?: boolean;
  bigAudio?: boolean; // track audio > 64 KB đứng trước track video
};
export const mp4 = (
  seconds: number,
  { moovLast = false, largeMdat = false, video = { width: 1920, height: 1080 }, audio = true, textFirst = false, audioFirst = false, bigAudio = false, ...mv }: Mp4Options = {},
) => {
  const v = video ? [trak(tkhd(video.width, video.height, video.rotate), 'vide')] : [];
  const a = audio ? [trak(tkhd(0, 0), 'soun', bigAudio ? 70_000 : 8)] : [];
  const t = textFirst ? [trak(tkhd(640, 480), 'text')] : [];
  const traks = t.concat(audioFirst || bigAudio ? [...a, ...v] : [...v, ...a]);
  const moov = box('moov', Buffer.concat([mvhd(seconds, mv), ...traks]));
  const data = Array.from({ length: 64 }, () => 7);
  const mdat = largeMdat
    ? Buffer.from([...u32(1), ...ascii('mdat'), ...u64(16 + data.length), ...data])
    : box('mdat', data);
  return Buffer.concat(moovLast ? [ftyp, box('free', []), mdat, moov] : [ftyp, moov, mdat]);
};
