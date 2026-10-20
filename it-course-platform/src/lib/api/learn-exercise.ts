import { api } from '@/lib/api/client';
import type { CodePayload, LearnExercise, RunResult, SubmissionDetail, SubmissionSummary } from '@/types/exercise';

// API học viên làm bài code (spec 2026-10-19-coding-exercise §7). Không poll: gọi một lần theo thao tác.
const base = (slug: string, itemId: string) => `/learn/${slug}/exercises/${itemId}`;
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);

export const getLearnExercise = (slug: string, itemId: string) => data<LearnExercise>(api.get(base(slug, itemId)));
export const runCode = (slug: string, itemId: string, body: CodePayload) =>
  data<RunResult>(api.post(`${base(slug, itemId)}/run`, body));
export const submitCode = (slug: string, itemId: string, body: CodePayload) =>
  data<{ id: string }>(api.post(`${base(slug, itemId)}/submissions`, body));
export const listSubmissions = (slug: string, itemId: string) =>
  data<SubmissionSummary[]>(api.get(`${base(slug, itemId)}/submissions`));
export const getSubmission = (slug: string, itemId: string, id: string) =>
  data<SubmissionDetail>(api.get(`${base(slug, itemId)}/submissions/${id}`));
