import { isStaff } from '../auth/auth.js';

// Tài khoản nghiệp vụ không có trang cá nhân → đứng tên nền tảng, giống tác giả bài viết.
const BRAND = { id: null, name: 'Aolumi', image: null } as const;
// image/role optional: user của session better-auth có thể thiếu hai trường này.
type UserLite = { id: string; name: string; image?: string | null; role?: string | null };

export const publicAuthor = (u: UserLite) => (isStaff(u.role) ? BRAND : { id: u.id, name: u.name, image: u.image ?? null });

// Trả lời một trả lời khác vẫn gắn về bình luận gốc: luôn 1 cấp.
export const rootOf = (target: { id: string; parentId: string | null }) => target.parentId ?? target.id;

export type NoticeKind = 'reply' | 'comment';

// Người được trả lời đứng trước (dòng "trả lời bình luận của bạn" cụ thể hơn); bỏ người viết, mỗi người 1 thông báo.
export function recipients(writerId: string, postAuthorId: string, repliedUserId: string | null) {
  const out: { userId: string; kind: NoticeKind }[] = [];
  if (repliedUserId && repliedUserId !== writerId) out.push({ userId: repliedUserId, kind: 'reply' });
  if (postAuthorId !== writerId && postAuthorId !== repliedUserId) out.push({ userId: postAuthorId, kind: 'comment' });
  return out;
}

export const canDeleteComment = (viewer: { id: string; role?: string | null }, commentUserId: string, postAuthorId: string) =>
  viewer.id === commentUserId || viewer.id === postAuthorId || !!viewer.role?.split(',').includes('admin');

// Xoá gốc thì DB xoá luôn các trả lời của nó.
export const removedCount = (c: { parentId: string | null; replyCount: number }) => (c.parentId ? 1 : 1 + c.replyCount);

export const noticeTitle = (kind: NoticeKind, writerName: string, postTitle: string) =>
  kind === 'reply'
    ? `${writerName} đã trả lời bình luận của bạn trong "${postTitle}"`
    : `${writerName} đã bình luận bài "${postTitle}"`;

// Gốc + trả lời (nếu có): FE mở đúng luồng mà không phải tra gốc.
export const commentLink = (slug: string, rootId: string, replyId?: string) =>
  `/blog/${slug}?comment=${rootId}${replyId ? `&reply=${replyId}` : ''}`;

// Markdown nhiều dòng → 1 dòng cho thông báo.
export const excerptLine = (s: string) => {
  const line = s.replace(/\s+/g, ' ').trim();
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
};
