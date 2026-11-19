import { api } from '@/lib/api/client';
import type { MyPost, MyPostRow, PostStatus, PostUploadTicket, SavePostPayload } from '@/types/post';

// Khu "Bài viết của tôi" + thao tác của admin. Chỉ gọi từ client component (cần cookie session).
export const getPostPermission = () => api.get<{ canWrite: boolean }>('/me/posts/permission').then((r) => r.data);

export const listMyPosts = (status?: PostStatus) =>
  api.get<MyPostRow[]>('/me/posts', { params: status ? { status } : undefined }).then((r) => r.data);

export const getMyPost = (id: string) => api.get<MyPost>(`/me/posts/${id}`).then((r) => r.data);

export const createPost = () => api.post<{ id: string }>('/me/posts').then((r) => r.data);

export const updatePost = (id: string, body: SavePostPayload) => api.patch<MyPost>(`/me/posts/${id}`, body).then((r) => r.data);

export const publishPost = (id: string) => api.post<MyPost>(`/me/posts/${id}/publish`).then((r) => r.data);

export const unpublishPost = (id: string) => api.post<MyPost>(`/me/posts/${id}/unpublish`).then((r) => r.data);

export const deletePost = (id: string) => api.delete(`/me/posts/${id}`).then(() => undefined);

export const createPostUpload = (body: { fileName: string; mimeType: string; sizeBytes: number }, signal?: AbortSignal) =>
  api.post<PostUploadTicket>('/me/posts/uploads', body, { signal }).then((r) => r.data);

export const adminRemovePost = (id: string, reason: string) =>
  api.post<{ id: string; status: PostStatus }>(`/admin/posts/${id}/remove`, { reason }).then((r) => r.data);

export const adminRestorePost = (id: string) =>
  api.post<{ id: string; status: PostStatus }>(`/admin/posts/${id}/restore`).then((r) => r.data);
