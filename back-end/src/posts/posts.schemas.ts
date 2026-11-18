import { PostStatus } from '@prisma/client';
import { z } from 'zod';
import { THUMBNAIL_MAX_BYTES } from '../assets/file-check.js';
import { BODY_MAX, EXCERPT_MAX, TITLE_MAX, TOPICS_MAX } from './post-rules.js';

// Postgres text không nhận 0x00.
const noNul = (s: string) => !s.includes('\u0000');
const BAD_CHAR = 'Nội dung chứa ký tự không hợp lệ';

// GET /posts. Không .strict(): link ngoài có thể kèm utm_*.
export const listPostsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  topic: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});
export type ListPostsQuery = z.output<typeof listPostsQuery>;

export const myPostsQuery = z.object({ status: z.enum(PostStatus).optional() });
export type MyPostsQuery = z.output<typeof myPostsQuery>;

// PATCH /me/posts/:id. Mọi trường tuỳ chọn: trình soạn tự lưu từng phần. Điều kiện xuất bản kiểm ở service.
export const savePostSchema = z
  .object({
    title: z.string().trim().max(TITLE_MAX, `Tiêu đề tối đa ${TITLE_MAX} ký tự`).refine(noNul, BAD_CHAR),
    excerpt: z
      .string()
      .trim()
      .max(EXCERPT_MAX, `Tóm tắt tối đa ${EXCERPT_MAX} ký tự`)
      .refine(noNul, BAD_CHAR)
      .transform((s) => s || null)
      .nullable(),
    coverUrl: z.url().max(500).nullable(),
    bodyHtml: z.string().max(BODY_MAX, 'Bài viết quá dài').refine(noNul, BAD_CHAR),
    topicIds: z
      .array(z.guid())
      .max(TOPICS_MAX, `Tối đa ${TOPICS_MAX} chủ đề`)
      .refine((ids) => new Set(ids).size === ids.length, 'Chủ đề bị trùng'),
    relatedCourseId: z.guid().nullable(),
  })
  .partial()
  .strict();
export type SavePostInput = z.output<typeof savePostSchema>;

export const postUploadSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], 'Chỉ nhận ảnh JPG, PNG hoặc WebP'),
    sizeBytes: z.int().min(1).max(THUMBNAIL_MAX_BYTES, 'Ảnh tối đa 5 MB'),
  })
  .strict();
export type PostUploadInput = z.output<typeof postUploadSchema>;

export const removePostSchema = z
  .object({ reason: z.string().trim().min(1, 'Hãy nhập lý do').max(500).refine(noNul, BAD_CHAR) })
  .strict();
export type RemovePostInput = z.output<typeof removePostSchema>;
