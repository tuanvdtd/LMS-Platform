import { z } from 'zod';

// Id có tồn tại / là cấp 1 hay không kiểm ở service (400 INVALID_CATEGORY).
const categoryIds = z
  .array(z.guid())
  .max(20, 'Tối đa 20 danh mục')
  .refine((ids) => new Set(ids).size === ids.length, 'Danh mục bị trùng');

export const createModeratorSchema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên').max(100, 'Tối đa 100 ký tự'),
    email: z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ')),
    categoryIds,
  })
  .strict();
export type CreateModeratorInput = z.output<typeof createModeratorSchema>;

export const moderatorCategoriesSchema = z.object({ categoryIds }).strict();
export type ModeratorCategoriesInput = z.output<typeof moderatorCategoriesSchema>;
