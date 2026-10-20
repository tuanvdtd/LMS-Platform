import { QuestionType } from '@prisma/client';
import { z } from 'zod';
import { emptyToNull } from '../curriculum/curriculum.schemas.js';

// spec 2026-10-08-quiz-authoring §4.3. FE dùng cùng giới hạn.
export const updateQuizSchema = z
  .object({
    description: z.string().trim().max(1000, 'Tối đa 1000 ký tự').transform(emptyToNull).nullable(),
    passScorePct: z.int().min(0, 'Từ 0 đến 100').max(100, 'Từ 0 đến 100'),
    shuffle: z.boolean(),
    topicIds: z
      .array(z.guid())
      .max(3, 'Tối đa 3 chủ đề')
      .refine((l) => new Set(l).size === l.length, 'Chủ đề bị trùng'),
  })
  .partial()
  .strict();
export type UpdateQuizInput = z.output<typeof updateQuizSchema>;

// Giới hạn chung cho soạn tay, import và nộp bài; FE (QUIZ_LIMITS) dùng cùng số.
export const QUIZ_MAX_QUESTIONS = 15;
export const QUIZ_MAX_OPTIONS = 5;

const optionSchema = z
  .object({
    content: z.string().trim().min(1, 'Nhập nội dung đáp án').max(500, 'Tối đa 500 ký tự'),
    isCorrect: z.boolean(),
    explanation: z.string().trim().max(600, 'Tối đa 600 ký tự').transform(emptyToNull).nullable().optional(),
  })
  .strict();

export const questionSchema = z
  .object({
    type: z.enum(QuestionType),
    stem: z.string().trim().min(1, 'Nhập đề bài').max(5000, 'Tối đa 5000 ký tự'),
    relatedItemId: z.guid().nullable().optional(),
    options: z.array(optionSchema).min(2, 'Cần ít nhất 2 đáp án').max(QUIZ_MAX_OPTIONS, `Tối đa ${QUIZ_MAX_OPTIONS} đáp án`),
  })
  .strict()
  .superRefine((q, ctx) => {
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (q.type === 'single_choice' && correct !== 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn đúng 1 đáp án đúng' });
    }
    if (q.type === 'multiple_choice' && correct < 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn ít nhất 1 đáp án đúng' });
    }
  });
export type QuestionInput = z.output<typeof questionSchema>;

export const moveQuestionSchema = z.object({ index: z.int().min(0) }).strict();
export type MoveQuestionInput = z.output<typeof moveQuestionSchema>;

export const importQuestionsSchema = z
  .object({
    questions: z
      .array(questionSchema)
      .min(1, 'Chưa có câu hỏi nào')
      .max(QUIZ_MAX_QUESTIONS, `Tối đa ${QUIZ_MAX_QUESTIONS} câu`),
  })
  .strict();
export type ImportQuestionsInput = z.output<typeof importQuestionsSchema>;
