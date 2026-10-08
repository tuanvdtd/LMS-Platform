import { api } from '@/lib/api/client';
import type { QuestionPayload, QuizDetail, QuizMutation, UpdateQuizPayload } from '@/types/curriculum';

// API soạn quiz (spec 2026-10-08-quiz-authoring §4.2). Mutation trả { quiz, curriculum }.
const base = (courseId: string, itemId: string) => `/instructor/courses/${courseId}/items/${itemId}/quiz`;
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);

export const getQuiz = (courseId: string, itemId: string) => data<QuizDetail>(api.get(base(courseId, itemId)));

export const updateQuiz = (courseId: string, itemId: string, body: UpdateQuizPayload) =>
  data<QuizMutation>(api.patch(base(courseId, itemId), body));

export const createQuestion = (courseId: string, itemId: string, body: QuestionPayload) =>
  data<QuizMutation>(api.post(`${base(courseId, itemId)}/questions`, body));

export const updateQuestion = (courseId: string, itemId: string, questionId: string, body: QuestionPayload) =>
  data<QuizMutation>(api.put(`${base(courseId, itemId)}/questions/${questionId}`, body));

export const deleteQuestion = (courseId: string, itemId: string, questionId: string) =>
  data<QuizMutation>(api.delete(`${base(courseId, itemId)}/questions/${questionId}`));

export const moveQuestion = (courseId: string, itemId: string, questionId: string, index: number) =>
  data<QuizMutation>(api.post(`${base(courseId, itemId)}/questions/${questionId}/move`, { index }));
