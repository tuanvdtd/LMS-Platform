import { api } from '@/lib/api/client';
import type { AttemptResult, AttemptSheet, QuizOverview, SubmitPayload } from '@/types/learn-quiz';

// API học viên làm quiz. Chỉ gọi từ client component.
const base = (slug: string, itemId: string) => `/learn/${encodeURIComponent(slug)}/quizzes/${itemId}`;
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);

export const getQuizOverview = (slug: string, itemId: string) => data<QuizOverview>(api.get(base(slug, itemId)));

export const startAttempt = (slug: string, itemId: string) =>
  data<AttemptSheet>(api.post(`${base(slug, itemId)}/attempts`));

export const submitAttempt = (slug: string, itemId: string, attemptId: string, body: SubmitPayload) =>
  data<AttemptResult>(api.post(`${base(slug, itemId)}/attempts/${attemptId}/submit`, body));

export const getAttemptResult = (slug: string, itemId: string, attemptId: string) =>
  data<AttemptResult>(api.get(`${base(slug, itemId)}/attempts/${attemptId}`));

// Mã lỗi nghiệp vụ BE ({ statusCode, code, message }).
export function apiErrorCode(e: unknown): string | undefined {
  const code = (e as { response?: { data?: { code?: unknown } } }).response?.data?.code;
  return typeof code === 'string' ? code : undefined;
}
