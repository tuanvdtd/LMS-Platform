import { exe, jpg, pdf, png, webp } from '../../test/fixtures/files.js';
import { imageInfo, isPdf } from './file-check.js';

describe('isPdf', () => {
  it('nhận file bắt đầu bằng %PDF-', () => expect(isPdf(pdf)).toBe(true));
  it('chỉ cần 5 byte đầu', () => expect(isPdf(pdf.subarray(0, 5))).toBe(true));
  it('từ chối exe đổi đuôi, ảnh, buffer rỗng', () => {
    expect(isPdf(exe)).toBe(false);
    expect(isPdf(png(800, 450))).toBe(false);
    expect(isPdf(Buffer.alloc(0))).toBe(false);
  });
});

describe('imageInfo', () => {
  it('đọc loại + kích thước PNG, JPEG, WebP', () => {
    expect(imageInfo(png(800, 450))).toEqual({
      type: 'png',
      width: 800,
      height: 450,
    });
    expect(imageInfo(jpg(1280, 720))).toEqual({
      type: 'jpg',
      width: 1280,
      height: 720,
    });
    expect(imageInfo(webp(750, 422))).toEqual({
      type: 'webp',
      width: 750,
      height: 422,
    });
  });
  it('file không phải ảnh / buffer cắt cụt → null (không ném)', () => {
    expect(imageInfo(exe)).toBeNull();
    expect(imageInfo(pdf)).toBeNull();
    expect(imageInfo(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00]))).toBeNull();
  });
});
