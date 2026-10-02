import { Occupation } from '@prisma/client';
import { z } from 'zod';

// all_levels là thuộc tính khoá ("hợp mọi trình độ"), học viên chỉ chọn 3 mức (spec §4, §6).
const LEARNER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const updatePreferencesSchema = z
  .object({
    occupation: z.enum(Occupation).nullable(),
    level: z.enum(LEARNER_LEVELS).nullable(),
    // guid: chỉ kiểm dạng 8-4-4-4-12; tồn tại do service kiểm.
    topicIds: z
      .array(z.guid())
      .max(30, 'Tối đa 30 kỹ năng')
      .refine((ids) => new Set(ids).size === ids.length, 'Kỹ năng bị trùng'),
  })
  .partial()
  .strict();
export type UpdatePreferencesInput = z.output<typeof updatePreferencesSchema>;
