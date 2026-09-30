import { courseSlug, slugify } from './slugify.js';

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, kể cả đ/Đ', () => {
    expect(slugify('Lập trình ReactJS từ A đến Z')).toBe('lap-trinh-reactjs-tu-a-den-z');
    expect(slugify('Đường đi của dữ liệu')).toBe('duong-di-cua-du-lieu');
  });

  it('ký tự đặc biệt thành một gạch, không có gạch ở đầu/cuối', () => {
    expect(slugify('  C++ & Node.js!!  ')).toBe('c-node-js');
    expect(slugify('!!!')).toBe('');
  });

  it('dài > 60 → cắt còn ≤ 60, không kết thúc bằng gạch', () => {
    expect(slugify('a'.repeat(100))).toBe('a'.repeat(60));
    expect(slugify(`${'a'.repeat(59)} bcd`)).toBe('a'.repeat(59));
  });
});

describe('courseSlug', () => {
  it('slug + hậu tố 6 ký tự [a-z0-9], mỗi lần một khác', () => {
    const a = courseSlug('Lập trình React');
    expect(a).toMatch(/^lap-trinh-react-[a-z0-9]{6}$/);
    expect(courseSlug('Lập trình React')).not.toBe(a);
  });

  it('tiêu đề không còn ký tự hợp lệ → chỉ hậu tố', () => {
    expect(courseSlug('!!!')).toMatch(/^[a-z0-9]{6}$/);
  });
});
