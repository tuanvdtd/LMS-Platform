import { z } from 'zod';

// spec 2026-10-17-quiz-taking §3. single_choice gửi > 1 đáp án → chấm sai, không 400.
export const submitSchema = z
  .object({
    answers: z
      .array(z.object({ questionId: z.guid(), optionIds: z.array(z.guid()).max(15) }).strict())
      .max(200)
      .refine((l) => new Set(l.map((a) => a.questionId)).size === l.length, 'Câu hỏi bị trùng'),
  })
  .strict();
export type SubmitInput = z.output<typeof submitSchema>;
