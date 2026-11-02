import { renderThumbnail, thumbnailKeyFromUrl } from './thumbnails.ts';

describe('thumbnails', () => {
  it('vẽ PNG 1280×720, chữ tiếng Việt không lỗi', () => {
    const png = renderThumbnail({ label: 'PostgreSQL', tagline: 'Truy vấn & tối ưu', rootSlug: 'development', seed: 'postgresql-abc' });
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1280);
    expect(png.readUInt32BE(20)).toBe(720);
  });
  it('lấy key từ URL công khai, bỏ qua URL ngoài thư mục thumbnails/', () => {
    expect(thumbnailKeyFromUrl('https://cdn.x/thumbnails/u/f.png', 'https://cdn.x')).toBe('thumbnails/u/f.png');
    expect(thumbnailKeyFromUrl('https://other/f.png', 'https://cdn.x')).toBeNull();
  });
});
