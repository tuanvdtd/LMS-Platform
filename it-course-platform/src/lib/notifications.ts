import type { AppNotification, NotificationType } from '@/types/notification';

export type Audience = 'student' | 'instructor';
type Meta = { label: string; audience: Audience };

// Thêm loại thông báo ở BE → khai ở đây: label = chip lọc trang Thông báo, audience = tab của chuông.
export const NOTIF_META: Record<NotificationType, Meta> = {
  verdict: { label: 'Chấm bài', audience: 'student' },
  qa_answer: { label: 'Hỏi đáp', audience: 'student' },
  course_review: { label: 'Duyệt khoá', audience: 'instructor' },
  instructor_application: { label: 'Giảng viên cao cấp', audience: 'instructor' },
};

// Chip trang Thông báo: học viên thường không bao giờ nhận loại của giảng viên → không hiện chip đó.
export const typesFor = (instructor: boolean) =>
  (Object.keys(NOTIF_META) as NotificationType[]).filter((t) => instructor || NOTIF_META[t].audience === 'student');

const FALLBACK: Meta = { label: 'Thông báo', audience: 'student' };

// BE thêm loại mới trước FE → vẫn hiện được, không crash.
export const metaOf = (type: string): Meta =>
  Object.hasOwn(NOTIF_META, type) ? NOTIF_META[type as NotificationType] : FALLBACK;

export function toastKind(n: Pick<AppNotification, 'type' | 'data'>): 'success' | 'error' | 'info' {
  if (n.type === 'verdict') return n.data.status === 'accepted' ? 'success' : 'error';
  if (n.type === 'course_review' || n.type === 'instructor_application') return n.data.approved ? 'success' : 'error';
  return 'info';
}

// Đang đứng đúng trang của link (bỏ query) → trang đó tự hiện kết quả, không cần toast.
export const isOnPage = (link: string | null, pathname: string) =>
  link !== null && new URL(link, 'http://x').pathname === pathname;
