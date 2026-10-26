import { z } from 'zod';

// Câu hỏi và câu trả lời đều là 1 ô Markdown kiểu bình luận (UI Hỏi đáp của sếp).
export const QA_BODY_MAX = 2000;
const qaBody = (empty: string) =>
  z
    .string()
    .trim()
    .min(1, empty)
    .max(QA_BODY_MAX, `Tối đa ${QA_BODY_MAX} ký tự`)
    // Postgres text không nhận 0x00.
    .refine((s) => !s.includes('\u0000'), 'Nội dung chứa ký tự không hợp lệ');

export const createQuestionSchema = z
  .object({ body: qaBody('Câu hỏi đang trống'), itemId: z.guid('Bài học không hợp lệ').optional() })
  .strict();
export type CreateQuestionInput = z.output<typeof createQuestionSchema>;

// replyToAnswerId: đang trả lời một câu trả lời khác (cùng câu hỏi) → ghi người được trả lời.
export const answerSchema = z
  .object({ body: qaBody('Câu trả lời đang trống'), replyToAnswerId: z.guid().optional() })
  .strict();
export type AnswerInput = z.output<typeof answerSchema>;

export const learnQuestionsQuery = z.object({ itemId: z.guid().optional(), cursor: z.guid().optional() });
export type LearnQuestionsQuery = z.output<typeof learnQuestionsQuery>;

export const instructorQuestionsQuery = z.object({
  courseId: z.guid().optional(),
  unanswered: z.enum(['1']).optional(),
  cursor: z.guid().optional(),
});
export type InstructorQuestionsQuery = z.output<typeof instructorQuestionsQuery>;
