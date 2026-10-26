// src/lib/api/qa.ts — Hỏi đáp. Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { Answer, Question, QuestionPage } from '@/types/qa';

type AnswerBody = { body: string; replyToAnswerId?: string };

const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);
const learn = (slug: string) => `/learn/${encodeURIComponent(slug)}`;

// Học viên
export const listQuestions = (slug: string, params: { itemId?: string; cursor?: string }) =>
  data<QuestionPage>(api.get(`${learn(slug)}/questions`, { params }));
export const askQuestion = (slug: string, body: { body: string; itemId?: string }) =>
  data<Question>(api.post(`${learn(slug)}/questions`, body));
export const postAnswer = (slug: string, questionId: string, body: AnswerBody) =>
  data<Answer>(api.post(`${learn(slug)}/questions/${questionId}/answers`, body));
export const deleteQuestion = (slug: string, questionId: string) =>
  api.delete(`${learn(slug)}/questions/${questionId}`).then(() => undefined);
export const deleteAnswer = (slug: string, answerId: string) =>
  api.delete(`${learn(slug)}/answers/${answerId}`).then(() => undefined);

// Giảng viên
export const listInstructorQuestions = (params: { courseId?: string; unanswered?: '1'; cursor?: string }) =>
  data<QuestionPage>(api.get('/instructor/questions', { params }));
export const postInstructorAnswer = (questionId: string, body: AnswerBody) =>
  data<Answer>(api.post(`/instructor/questions/${questionId}/answers`, body));
export const deleteInstructorQuestion = (questionId: string) =>
  api.delete(`/instructor/questions/${questionId}`).then(() => undefined);
export const deleteInstructorAnswer = (answerId: string) =>
  api.delete(`/instructor/questions/answers/${answerId}`).then(() => undefined);
