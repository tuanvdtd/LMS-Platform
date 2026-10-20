import { z } from 'zod';
import { LANGUAGE_IDS } from './code-runner.js';
import { MAX_CODE } from './exercise.schemas.js';

export const codeSchema = z
  .object({
    language: z.enum(LANGUAGE_IDS),
    sourceCode: z
      .string()
      .max(MAX_CODE, 'Code tối đa 64 KB')
      .refine((s) => s.trim().length > 0, 'Code đang trống')
      // Postgres text không nhận 0x00.
      .refine((s) => !s.includes('\u0000'), 'Code chứa ký tự không hợp lệ'),
  })
  .strict();
export type CodeInput = z.output<typeof codeSchema>;
