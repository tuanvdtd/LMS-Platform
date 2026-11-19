import { api } from '@/lib/api/client';
import type { LikeState, PostComment, PostCommentPage, PostCommentThread } from '@/types/post';

// Tim + bình luận bài viết. Gọi từ client component: số liệu luôn mới, trang bài thì cache 60 giây.
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);
const base = (slug: string) => `/posts/${encodeURIComponent(slug)}`;

export const listComments = (slug: string, cursor?: string) =>
  data<PostCommentPage>(api.get(`${base(slug)}/comments`, { params: cursor ? { cursor } : undefined }));
export const getCommentThread = (slug: string, id: string) =>
  data<PostCommentThread>(api.get(`${base(slug)}/comments/${encodeURIComponent(id)}`));
export const createComment = (slug: string, body: { body: string; replyToCommentId?: string }) =>
  data<PostComment>(api.post(`${base(slug)}/comments`, body));
export const deleteComment = (id: string) => api.delete(`/post-comments/${id}`).then(() => undefined);

export const getLike = (slug: string) => data<LikeState>(api.get(`${base(slug)}/like`));
export const setLike = (slug: string, liked: boolean) =>
  data<LikeState>(liked ? api.put(`${base(slug)}/like`) : api.delete(`${base(slug)}/like`));
