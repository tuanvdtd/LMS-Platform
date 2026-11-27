import { z } from 'zod';
import { QUIZ_MAX_OPTIONS, QUIZ_MAX_QUESTIONS } from './quiz.schemas.js';

// Body lưu câu và nộp bài: danh sách câu kèm đáp án đang chọn. optionIds rỗng = bỏ chọn hết.
// single_choice gửi > 1 đáp án → chấm sai, không 400.
export const answersSchema = z
  .object({
    answers: z
      .array(z.object({ questionId: z.guid(), optionIds: z.array(z.guid()).max(QUIZ_MAX_OPTIONS) }).strict())
      .max(QUIZ_MAX_QUESTIONS)
      .refine((l) => new Set(l.map((a) => a.questionId)).size === l.length, 'Câu hỏi bị trùng'),
  })
  .strict();
export type AnswersInput = z.output<typeof answersSchema>;
