// Schema form câu hỏi + chuyển sang payload API; dùng chung cho QuestionForm và nhập CSV.
// File thuần, không import alias → test bằng node:test.
import { z } from 'zod';
import { QUIZ_LIMITS as L, type QuestionPayload } from '../../../../../../../../types/curriculum.ts';

export const NONE = 'none'; // giá trị Select "không có bài giảng liên quan"

export const questionSchema = z
  .object({
    type: z.enum(['single_choice', 'multiple_choice']),
    stem: z.string().trim().min(1, 'Nhập đề bài').max(L.stem, `Tối đa ${L.stem} ký tự`),
    relatedItemId: z.string(),
    options: z
      .array(
        z.object({
          content: z.string().trim().min(1, 'Nhập nội dung đáp án').max(L.option, `Tối đa ${L.option} ký tự`),
          isCorrect: z.boolean(),
          explanation: z.string().max(L.explanation, `Tối đa ${L.explanation} ký tự`),
        }),
      )
      .min(L.minOptions, `Cần ít nhất ${L.minOptions} đáp án`)
      .max(L.maxOptions, `Tối đa ${L.maxOptions} đáp án`),
  })
  .superRefine((q, ctx) => {
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (q.type === 'single_choice' && correct !== 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn đúng 1 đáp án đúng' });
    }
    if (q.type === 'multiple_choice' && correct < 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn ít nhất 1 đáp án đúng' });
    }
  });
export type QuestionValues = z.infer<typeof questionSchema>;

export const toPayload = (v: QuestionValues): QuestionPayload => ({
  type: v.type,
  stem: v.stem.trim(),
  relatedItemId: v.relatedItemId === NONE ? null : v.relatedItemId,
  options: v.options.map((o) => ({
    content: o.content.trim(),
    isCorrect: o.isCorrect,
    explanation: o.explanation.trim() || null,
  })),
});
