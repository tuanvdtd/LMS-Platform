import { z } from 'zod';

// optionIds rỗng = "Tôi không biết". ≤ 5 = số đáp án tối đa của một câu.
export const answerSchema = z.object({ questionId: z.guid(), optionIds: z.array(z.guid()).max(5) }).strict();
export type AnswerInput = z.output<typeof answerSchema>;
