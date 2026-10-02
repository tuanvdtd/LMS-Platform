// Buffer tối thiểu đủ để isPdf / image-size nhận dạng (spec curriculum-upload §7). Không phải file mở được.
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
