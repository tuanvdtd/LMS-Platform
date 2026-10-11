import { CurriculumItemType } from '@prisma/client';
import { z } from 'zod';

// spec curriculum-upload §4.2. FE dùng cùng giới hạn.
const title = z.string().trim().min(1, 'Nhập tiêu đề').max(80, 'Tối đa 80 ký tự');
export const emptyToNull = (s: string) => (s === '' ? null : s);
const index = z.int().min(0);

export const createSectionSchema = z
  .object({ title, description: z.string().trim().max(200, 'Tối đa 200 ký tự').transform(emptyToNull).optional() })
  .strict();
export type CreateSectionInput = z.output<typeof createSectionSchema>;

export const updateSectionSchema = createSectionSchema.partial();
export type UpdateSectionInput = z.output<typeof updateSectionSchema>;

export const moveSectionSchema = z.object({ index }).strict();
export type MoveSectionInput = z.output<typeof moveSectionSchema>;

export const createItemSchema = z.object({ type: z.enum(CurriculumItemType), title }).strict();
export type CreateItemInput = z.output<typeof createItemSchema>;

export const updateItemSchema = z
  .object({
    title,
    description: z.string().trim().max(5000, 'Tối đa 5000 ký tự').transform(emptyToNull).nullable(),
    isPreview: z.boolean(),
    isDownloadable: z.boolean(),
  })
  .partial()
  .strict();
export type UpdateItemInput = z.output<typeof updateItemSchema>;

export const moveItemSchema = z.object({ sectionId: z.guid(), index }).strict();
export type MoveItemInput = z.output<typeof moveItemSchema>;

export const setContentSchema = z.object({ assetId: z.guid() }).strict();
export type SetContentInput = z.output<typeof setContentSchema>;

export const addResourceSchema = z.object({ assetId: z.guid(), title: title.optional() }).strict();
export type AddResourceInput = z.output<typeof addResourceSchema>;
