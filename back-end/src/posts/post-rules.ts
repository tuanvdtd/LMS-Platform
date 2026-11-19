import { isStaff } from '../auth/auth.js';
import type { FieldError } from '../common/zod.pipe.js';

export const TITLE_MAX = 150;
export const EXCERPT_MAX = 300;
export const BODY_MAX = 300_000;
export const TOPICS_MAX = 3;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

// Chữ thuần của bài: đếm từ, cắt tóm tắt, kiểm rỗng. Không dùng để hiển thị.
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, ' ')
    .trim();
}

const wordCount = (html: string) => plainText(html).split(' ').filter(Boolean).length;

// Văn xuôi 200 từ/phút. Chữ trong khối code đọc chậm gấp đôi (100 từ/phút) vì người đọc phải dừng lại hiểu.
// Ảnh tính kiểu Medium: ảnh đầu 12 giây, mỗi ảnh sau bớt 1 giây, không dưới 3 giây.
export function readingMinutes(html: string): number {
  const codeBlocks = html.match(/<pre[\s\S]*?<\/pre>/gi) ?? [];
  const codeWords = codeBlocks.reduce((n, block) => n + wordCount(block), 0);
  const proseWords = wordCount(html.replace(/<pre[\s\S]*?<\/pre>/gi, ' '));
  const images = html.match(/<img\s/gi)?.length ?? 0;
  let seconds = (proseWords * 60) / 200 + (codeWords * 60) / 100;
  for (let i = 0; i < images; i++) seconds += Math.max(3, 12 - i);
  return Math.max(1, Math.round(seconds / 60));
}

export function excerptOf(html: string, max = EXCERPT_MAX): string {
  const text = plainText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

// Role instructor ai cũng tự bật được → chỉ tính là giảng viên khi đã qua duyệt đơn hoặc có khoá đang bán
// (cùng điều kiện với ProfilesService.publicProfile). Moderator là tài khoản nghiệp vụ, không viết bài.
export function canWriteFrom(u: { role: string | null; hasInstructorProfile: boolean; hasPublishedCourse: boolean }): boolean {
  if (u.role?.split(',').includes('admin')) return true;
  if (isStaff(u.role)) return false;
  return u.hasInstructorProfile || u.hasPublishedCourse;
}

// Ảnh bìa bắt buộc (sếp chốt 2026-11-18): thẻ bài ở /blog và ảnh chia sẻ link luôn có hình.
export function publishProblems(p: { title: string; bodyHtml: string; topicCount: number; coverUrl: string | null }): FieldError[] {
  const errors: FieldError[] = [];
  if (!p.title.trim()) errors.push({ path: ['title'], message: 'Hãy nhập tiêu đề' });
  if (!plainText(p.bodyHtml) && !/<img\s/i.test(p.bodyHtml)) errors.push({ path: ['bodyHtml'], message: 'Bài viết chưa có nội dung' });
  if (p.topicCount < 1 || p.topicCount > TOPICS_MAX) {
    errors.push({ path: ['topicIds'], message: `Chọn từ 1 đến ${TOPICS_MAX} chủ đề` });
  }
  if (!p.coverUrl) errors.push({ path: ['coverUrl'], message: 'Hãy chọn ảnh bìa' });
  return errors;
}
