import { Difficulty } from '@prisma/client';
import { z } from 'zod';
import { emptyToNull } from '../curriculum/curriculum.schemas.js';
import { LANGUAGE_IDS } from './code-runner.js';

// spec 2026-10-19-coding-exercise §6. FE dùng cùng giới hạn.
export const MAX_CODE = 64 * 1024;
const MAX_IO = 64 * 1024;
const unique = <T>(l: T[]) => new Set(l).size === l.length;

export const updateExerciseSchema = z
  .object({
    instructions: z.string().trim().max(20_000, 'Tối đa 20.000 ký tự'),
    hints: z.array(z.string().trim().min(1, 'Nhập gợi ý').max(500, 'Tối đa 500 ký tự')).max(5, 'Tối đa 5 gợi ý'),
    difficulty: z.enum(Difficulty),
    learningObjective: z.string().trim().max(200, 'Tối đa 200 ký tự').transform(emptyToNull).nullable(),
    solutionExplanation: z.string().trim().max(5000, 'Tối đa 5000 ký tự').transform(emptyToNull).nullable(),
    relatedItemId: z.guid().nullable(),
    topicIds: z.array(z.guid()).max(3, 'Tối đa 3 chủ đề').refine(unique, 'Chủ đề bị trùng'),
  })
  .partial()
  .strict();
export type UpdateExerciseInput = z.output<typeof updateExerciseSchema>;

const code = z.string().max(MAX_CODE, 'Code tối đa 64 KB');
const io = z.string().max(MAX_IO, 'Tối đa 64 KB');

export const updateCodeSchema = z
  .object({
    languages: z.array(z.enum(LANGUAGE_IDS)).min(1, 'Chọn ít nhất 1 ngôn ngữ').refine(unique, 'Ngôn ngữ bị trùng'),
    timeLimitMs: z.int().min(500, 'Từ 500 đến 10.000 ms').max(10_000, 'Từ 500 đến 10.000 ms'),
    memoryLimitKb: z.int().min(32_000, 'Từ 32.000 đến 512.000 KB').max(512_000, 'Từ 32.000 đến 512.000 KB'),
    starters: z.array(z.object({ language: z.enum(LANGUAGE_IDS), code, solutionCode: code.nullable() }).strict()),
    tests: z
      .array(
        z
          .object({
            id: z.guid().optional(),
            input: io,
            expectedOutput: io,
            isPublic: z.boolean(),
            points: z.int().min(1, 'Từ 1 đến 100').max(100, 'Từ 1 đến 100'),
          })
          .strict(),
      )
      .max(20, 'Tối đa 20 test'),
  })
  .strict()
  .superRefine((b, ctx) => {
    // BR5: mỗi ngôn ngữ đúng 1 starter.
    if (b.starters.map((s) => s.language).sort().join() !== [...b.languages].sort().join()) {
      ctx.addIssue({ code: 'custom', path: ['starters'], message: 'Mỗi ngôn ngữ cần đúng 1 starter' });
    }
    const ids = b.tests.flatMap((t) => (t.id ? [t.id] : []));
    if (!unique(ids)) ctx.addIssue({ code: 'custom', path: ['tests'], message: 'Test bị trùng' });
  });
export type UpdateCodeInput = z.output<typeof updateCodeSchema>;
