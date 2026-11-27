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

export const saveAnswers = (slug: string, itemId: string, attemptId: string, body: SubmitPayload) =>
  data<{ remainingSec: number | null }>(api.put(`${base(slug, itemId)}/attempts/${attemptId}/answers`, body));

// Lúc trang bị ẩn/đóng: keepalive giữ request sống sau khi tab đóng. Best-effort — câu chưa lưu
// vẫn nằm trong localStorage và được gửi bù khi học viên quay lại.
export function saveAnswersOnHide(slug: string, itemId: string, attemptId: string, body: SubmitPayload) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api${base(slug, itemId)}/attempts/${attemptId}/answers`, {
    method: 'PUT',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.ok, () => false);
}

export const getAttemptResult = (slug: string, itemId: string, attemptId: string) =>
  data<AttemptResult>(api.get(`${base(slug, itemId)}/attempts/${attemptId}`));

// Trường thêm trong body lỗi BE, vd nextAttemptAt của 409 ATTEMPT_LIMIT.
export function apiErrorField(e: unknown, field: string): unknown {
  return (e as { response?: { data?: Record<string, unknown> } }).response?.data?.[field];
}

// Mã lỗi nghiệp vụ BE ({ statusCode, code, message }).
export function apiErrorCode(e: unknown): string | undefined {
  const code = (e as { response?: { data?: { code?: unknown } } }).response?.data?.code;
  return typeof code === 'string' ? code : undefined;
}
