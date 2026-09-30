import { randomBytes } from 'node:crypto';

// "Lập trình C++ cơ bản" → "lap-trinh-c-co-ban". đ/Đ không tách dấu bằng NFD nên thay tay.
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Hậu tố ngẫu nhiên để hai khoá cùng tên không đụng nhau; slug không đổi khi sửa tiêu đề (spec §4.1).
export function courseSlug(title: string): string {
  const suffix = Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');
  const base = slugify(title);
  return base ? `${base}-${suffix}` : suffix;
}
