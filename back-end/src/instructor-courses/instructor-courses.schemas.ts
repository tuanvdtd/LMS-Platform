import { SkillLevel } from '@prisma/client';
import { z } from 'zod';
import { countWords } from './course-checklist.js';

// Luật PATCH theo spec course-create-basics §4.3. FE dùng cùng giới hạn.
const title = z.string().trim().min(1, 'Nhập tên khoá học').max(60, 'Tối đa 60 ký tự');
const emptyToNull = (s: string) => (s === '' ? null : s);
const stringList = z
  .array(z.string().trim().max(160, 'Tối đa 160 ký tự'))
  .max(10, 'Tối đa 10 mục')
  .transform((list) => list.filter(Boolean));

export const createCourseSchema = z.object({ title }).strict();
export type CreateCourseInput = z.output<typeof createCourseSchema>;

export const updateCourseSchema = z
  .object({
    title,
    subtitle: z.string().trim().max(120, 'Tối đa 120 ký tự').transform(emptyToNull),
    description: z
      .string()
      .trim()
      .refine((s) => countWords(s) <= 5000, 'Tối đa 5000 từ')
      .transform(emptyToNull),
    language: z.enum(['vi', 'en']),
    level: z.enum(SkillLevel).nullable(),
    // guid: chỉ kiểm dạng 8-4-4-4-12; tồn tại/cấp 2 do service kiểm.
    categoryId: z.guid().nullable(),
    primaryTopicId: z.guid().nullable(),
    learningObjectives: stringList,
    requirements: stringList,
    targetAudience: stringList,
  })
  .partial()
  .strict();
export type UpdateCourseInput = z.output<typeof updateCourseSchema>;

// Key do POST /instructor/assets/uploads sinh: ảnh bìa, video giới thiệu.
export const mediaKeySchema = z.object({ key: z.string().max(200) }).strict();
export type MediaKeyInput = z.output<typeof mediaKeySchema>;
