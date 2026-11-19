import type { CourseCard } from '@/types/catalog';

// Khớp API back-end/src/posts.
export type PostStatus = 'draft' | 'published' | 'removed';

// id null: bài của tài khoản quản trị, đứng tên "Aolumi", không có trang cá nhân.
export interface PostAuthor {
  id: string | null;
  name: string;
  image: string | null;
}

export interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  readingMinutes: number;
  publishedAt: string;
  topics: { slug: string; name: string }[];
  author: PostAuthor;
}

export interface PostDetail extends PostCard {
  bodyHtml: string; // CHƯA lọc: chỉ hiển thị qua renderPostHtml (lib/post-html.ts)
  updatedAt: string;
  author: PostAuthor & { headline: string | null; bio: string | null };
  relatedCourse: CourseCard | null;
  fromAuthor: PostCard[]; // tối đa 3 bài khác của cùng tác giả
  more: PostCard[]; // tối đa 4 bài cùng chủ đề, không lặp bài ở fromAuthor
}

export interface PostList {
  items: PostCard[];
  total: number;
  page: number;
  limit: number;
  topic: { slug: string; name: string } | null;
}

export interface PostTopicCount {
  slug: string;
  name: string;
  count: number;
}

export interface MyPostRow {
  id: string;
  title: string;
  slug: string | null;
  status: PostStatus;
  updatedAt: string;
  publishedAt: string | null;
  removedReason: string | null;
}

export interface MyPost extends MyPostRow {
  excerpt: string | null;
  coverUrl: string | null;
  bodyHtml: string;
  relatedCourseId: string | null;
  topics: { id: string; slug: string; name: string }[];
}

export interface SavePostPayload {
  title?: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  bodyHtml?: string;
  topicIds?: string[];
  relatedCourseId?: string | null;
}

export interface PostUploadTicket {
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
}
