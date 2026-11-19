import { fetchJson } from '@/lib/api/catalog';
import type { PostCard, PostDetail, PostList, PostTopicCount } from '@/types/post';

// Blog công khai, đọc phía server, cache 60s như catalog: bài vừa xuất bản / sửa có thể trễ tối đa 1 phút.
export async function listPosts(p: { q?: string; topic?: string; page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') sp.set(k, String(v));
  return fetchJson<PostList>(`/posts?${sp}`);
}

export async function listPostTopics() {
  return (await fetchJson<PostTopicCount[]>('/post-topics')) ?? [];
}

export async function getPost(slug: string) {
  return fetchJson<PostDetail>(`/posts/${encodeURIComponent(slug)}`);
}

export async function getUserPosts(id: string) {
  return (await fetchJson<PostCard[]>(`/users/${encodeURIComponent(id)}/posts`)) ?? [];
}
