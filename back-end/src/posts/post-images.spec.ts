import { postImageKeys } from './post-images.js';

const BASE = 'https://cdn.test';
// Giống StorageService.keyOfPublicUrl: chỉ link R2 public mới đổi được thành key.
const keyOf = (url: string) => (url.startsWith(`${BASE}/`) ? url.slice(BASE.length + 1) : null);

describe('postImageKeys', () => {
  it('lấy ảnh trong nội dung và ảnh bìa, src ở vị trí nào trong thẻ cũng được', () => {
    const html = `<p><img src="${BASE}/posts/u/a.png" alt=""></p><img alt="x" src="${BASE}/posts/u/b.webp">`;
    expect(postImageKeys(html, `${BASE}/posts/u/c.jpg`, keyOf)).toEqual(['posts/u/a.png', 'posts/u/b.webp', 'posts/u/c.jpg']);
  });

  it('bỏ link trang ngoài và file R2 ngoài thư mục posts/', () => {
    const html = `<img src="https://evil.example/a.png"><img src="${BASE}/promos/u/v.mp4">`;
    expect(postImageKeys(html, 'https://evil.example/bia.png', keyOf)).toEqual([]);
  });

  it('một ảnh lặp lại, hoặc vừa là ảnh bìa vừa trong nội dung, chỉ tính một lần', () => {
    const a = `${BASE}/posts/u/a.png`;
    expect(postImageKeys(`<img src="${a}"><p>x</p><img src="${a}">`, a, keyOf)).toEqual(['posts/u/a.png']);
  });

  it('không có ảnh bìa, nội dung rỗng → rỗng', () => {
    expect(postImageKeys('', null, keyOf)).toEqual([]);
    expect(postImageKeys('<p>chỉ có chữ</p>', null, keyOf)).toEqual([]);
  });
});
