import {
  box,
  exe,
  jpg,
  mp4,
  mvhd,
  pdf,
  png,
  webp,
} from '../../test/fixtures/files.js';
import { imageInfo, isPdf, mp4Duration, mp4Size, videoSizeProblem } from './file-check.js';

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
    expect(
      imageInfo(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00])),
    ).toBeNull();
  });
});

describe('mp4Duration', () => {
  const run = (buf: Buffer) =>
    mp4Duration(
      (offset, length) =>
        Promise.resolve(buf.subarray(offset, offset + length)),
      buf.length,
    );
  const ftypOnly = mp4(1).subarray(0, 32); // ftyp của fixture dài 32 byte

  it('moov trước mdat → số giây làm tròn', async () => {
    expect(await run(mp4(754))).toBe(754);
    expect(await run(mp4(0))).toBe(0); // MP4 phân mảnh: mvhd duration = 0 → hợp lệ, không null
    expect(await run(mp4(10, { timescale: 30000 }))).toBe(10);
  });
  it('moov sau mdat (kiểu OBS), mdat dùng largesize', async () => {
    expect(await run(mp4(125, { moovLast: true }))).toBe(125);
    expect(await run(mp4(90, { moovLast: true, largeMdat: true }))).toBe(90);
  });
  it('mvhd version 1 (64-bit)', async () => {
    expect(await run(mp4(3600, { version: 1 }))).toBe(3600);
  });
  it('box size 0 = tới cuối file', async () => {
    const moov = box('moov', mvhd(42));
    moov.writeUInt32BE(0, 0);
    expect(await run(Buffer.concat([ftypOnly, moov]))).toBe(42);
  });
  it('không phải MP4 / hỏng → null', async () => {
    expect(await run(pdf)).toBeNull();
    expect(await run(exe)).toBeNull();
    expect(await run(ftypOnly)).toBeNull(); // không có moov
    expect(await run(Buffer.concat([ftypOnly, box('moov', [])]))).toBeNull(); // moov không có mvhd
    expect(await run(mp4(10, { timescale: 0 }))).toBeNull();
    expect(await run(mp4(25 * 3600, { version: 1 }))).toBeNull(); // quá 24 giờ
    expect(await run(mp4(10).subarray(0, 60))).toBeNull(); // cắt cụt giữa moov
    expect(
      await run(
        Buffer.concat([
          ftypOnly,
          Buffer.from([0, 0, 0, 4, 0x66, 0x72, 0x65, 0x65]),
        ]),
      ),
    ).toBeNull(); // size < 8
  });
  it('quá 20 box mà chưa gặp moov → null', async () => {
    const frees = Array.from({ length: 25 }, () => box('free', []));
    expect(
      await run(Buffer.concat([ftypOnly, ...frees, box('moov', mvhd(5))])),
    ).toBeNull();
  });
});

describe('mp4Size', () => {
  const run = (buf: Buffer) =>
    mp4Size((offset, length) => Promise.resolve(buf.subarray(offset, offset + length)), buf.length);

  it('MP4 ngang có tiếng → kích thước + hasAudio', async () => {
    expect(await run(mp4(10))).toEqual({ width: 1920, height: 1080, hasAudio: true });
    expect(await run(mp4(10, { moovLast: true, video: { width: 1280, height: 720 } }))).toEqual({
      width: 1280,
      height: 720,
      hasAudio: true,
    });
  });
  it('matrix xoay 90° → đổi chỗ width/height (kích thước hiển thị)', async () => {
    expect(await run(mp4(10, { video: { width: 1920, height: 1080, rotate: 90 } }))).toMatchObject({ width: 1080, height: 1920 });
  });
  it('matrix xoay 270° → đổi chỗ width/height', async () => {
    expect(await run(mp4(10, { video: { width: 1920, height: 1080, rotate: 270 } }))).toMatchObject({ width: 1080, height: 1920 });
  });
  it('track text (tkhd 640×480) đứng trước track hình → vẫn lấy kích thước track hình', async () => {
    expect(await run(mp4(10, { textFirst: true }))).toEqual({ width: 1920, height: 1080, hasAudio: true });
  });
  it('cấu trúc lồng độc hại: số lần đọc bị chặn, kết quả null', async () => {
    const free20 = Buffer.concat(Array.from({ length: 20 }, () => box('free', [])));
    const mdia20 = Buffer.concat(Array.from({ length: 20 }, () => box('mdia', free20)));
    const trak20 = Buffer.concat(Array.from({ length: 20 }, () => box('trak', mdia20)));
    const buf = Buffer.concat([mp4(1).subarray(0, 32), box('moov', trak20)]);
    let reads = 0;
    const result = await mp4Size((offset, length) => {
      reads++;
      return Promise.resolve(buf.subarray(offset, offset + length));
    }, buf.length);
    expect(result).toBeNull();
    expect(reads).toBeLessThanOrEqual(150);
  });
  it('không có tiếng → hasAudio false', async () => {
    expect(await run(mp4(10, { audio: false }))).toEqual({ width: 1920, height: 1080, hasAudio: false });
  });
  it('track audio > 64 KB đứng trước track video vẫn đọc được', async () => {
    expect(await run(mp4(10, { bigAudio: true }))).toEqual({ width: 1920, height: 1080, hasAudio: true });
  });
  it('chỉ có tiếng / không phải MP4 → null', async () => {
    expect(await run(mp4(10, { video: null }))).toBeNull();
    expect(await run(pdf)).toBeNull();
  });
});

describe('videoSizeProblem', () => {
  it('chặn dọc trước, rồi chặn dưới 720p', () => {
    expect(videoSizeProblem({ width: 1080, height: 1920 })).toBe('Chỉ nhận video ngang');
    expect(videoSizeProblem({ width: 854, height: 480 })).toBe('Video phải từ 720p trở lên');
    expect(videoSizeProblem({ width: 1280, height: 720 })).toBeNull();
    expect(videoSizeProblem({ width: 1440, height: 900 })).toBeNull(); // 16:10 vẫn nhận
  });
});
