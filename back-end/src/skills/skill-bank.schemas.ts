import { SkillDifficulty } from '@prisma/client';
import { z } from 'zod';
import { questionSchema } from '../quiz/quiz.schemas.js';

// Cùng luật soạn câu với quiz (độ dài, 2–5 đáp án, số đáp án đúng) + độ khó. safeExtend giữ superRefine của quiz.
export const skillQuestionSchema = questionSchema.safeExtend({ difficulty: z.enum(SkillDifficulty) });
export type SkillQuestionInput = z.output<typeof skillQuestionSchema>;

export const importSkillQuestionsSchema = z
  .object({ questions: z.array(skillQuestionSchema).min(1, 'Chưa có câu hỏi nào').max(200, 'Tối đa 200 câu') })
  .strict();
export type ImportSkillQuestionsInput = z.output<typeof importSkillQuestionsSchema>;

export const listQuestionsQuery = z.object({
  status: z.enum(['active', 'archived']).default('active'),
  difficulty: z.enum(SkillDifficulty).optional(),
});
export type ListQuestionsQuery = z.output<typeof listQuestionsQuery>;
