import { z } from 'zod';

// Học được nửa khoá mới đủ cơ sở nhận xét. Chỉ áp khi tạo mới.
export const REVIEW_MIN_PROGRESS_PCT = 50;
export const REVIEW_COMMENT_MAX = 1000;

const rating = z.number().int().min(1).max(5);

export const saveReviewSchema = z
  .object({
    rating,
    comment: z
      .string()
      .trim()
      .max(REVIEW_COMMENT_MAX, `Tối đa ${REVIEW_COMMENT_MAX} ký tự`)
      // Postgres text không nhận 0x00.
      .refine((s) => !s.includes('\u0000'), 'Nội dung chứa ký tự không hợp lệ')
      // Chỉ chấm sao, không viết gì → lưu null thay vì chuỗi rỗng.
      .transform((s) => s || null)
      .nullish(),
  })
  .strict();
export type SaveReviewInput = z.output<typeof saveReviewSchema>;

export const listReviewsQuery = z.object({
  rating: z.coerce.number().pipe(rating).optional(),
  cursor: z.guid().optional(),
});
export type ListReviewsQuery = z.output<typeof listReviewsQuery>;
