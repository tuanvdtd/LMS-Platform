// src/lib/api/skill-bank.ts — Ngân hàng câu hỏi kỹ năng (staff). Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { AdminSkillQuestion, AdminSkillTopic, SkillDifficulty, SkillQuestionPayload } from '@/types/skills';

export const listSkillTopics = () => api.get<AdminSkillTopic[]>('/admin/skill-topics').then((r) => r.data);
export const listSkillQuestions = (topicId: string, params: { status: 'active' | 'archived'; difficulty?: SkillDifficulty }) =>
  api
    .get<{ topic: { id: string; slug: string; name: string }; questions: AdminSkillQuestion[] }>(
      `/admin/skill-topics/${topicId}/questions`,
      { params },
    )
    .then((r) => r.data);
export const createSkillQuestion = (topicId: string, body: SkillQuestionPayload) =>
  api.post<AdminSkillQuestion>(`/admin/skill-topics/${topicId}/questions`, body).then((r) => r.data);
export const importSkillQuestions = (topicId: string, questions: SkillQuestionPayload[]) =>
  api.post<{ created: number }>(`/admin/skill-topics/${topicId}/questions/import`, { questions }).then((r) => r.data);
export const updateSkillQuestion = (id: string, body: SkillQuestionPayload) =>
  api.patch<AdminSkillQuestion>(`/admin/skill-questions/${id}`, body).then((r) => r.data);
export const archiveSkillQuestion = (id: string) =>
  api.post<AdminSkillQuestion>(`/admin/skill-questions/${id}/archive`).then((r) => r.data);
export const restoreSkillQuestion = (id: string) =>
  api.post<AdminSkillQuestion>(`/admin/skill-questions/${id}/restore`).then((r) => r.data);
