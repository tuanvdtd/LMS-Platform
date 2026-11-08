// src/lib/api/skills.ts — Bài đánh giá kỹ năng. Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { AttemptState, SkillsOverview } from '@/types/skills';

export const getSkills = () => api.get<SkillsOverview>('/skills').then((r) => r.data);
export const startAttempt = (topicSlug: string) => api.post<AttemptState>(`/skills/${topicSlug}/attempts`).then((r) => r.data);
export const getAttempt = (id: string) => api.get<AttemptState>(`/skills/attempts/${id}`).then((r) => r.data);
export const answerAttempt = (id: string, body: { questionId: string; optionIds: string[] }) =>
  api.post<AttemptState>(`/skills/attempts/${id}/answer`, body).then((r) => r.data);
