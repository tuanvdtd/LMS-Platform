import { isStaff } from '../auth/auth.js';
import type { FieldError } from '../common/zod.pipe.js';
import { plainText } from './post-text.js';

export { EXCERPT_MAX, excerptOf, plainText, readingMinutes } from './post-text.js';

export const TITLE_MAX = 150;
export const BODY_MAX = 300_000;
export const TOPICS_MAX = 3;

// Role instructor ai cũng tự bật được → chỉ tính là giảng viên khi đã qua duyệt đơn hoặc có khoá đang bán
// (cùng điều kiện với ProfilesService.publicProfile). Moderator là tài khoản nghiệp vụ, không viết bài.
export function canWriteFrom(u: { role: string | null; hasInstructorProfile: boolean; hasPublishedCourse: boolean }): boolean {
  if (u.role?.split(',').includes('admin')) return true;
  if (isStaff(u.role)) return false;
  return u.hasInstructorProfile || u.hasPublishedCourse;
}

// Ảnh bìa bắt buộc: thẻ bài ở /blog và ảnh chia sẻ link luôn có hình.
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
