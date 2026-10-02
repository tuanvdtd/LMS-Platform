import { api } from '@/lib/api/client';
import type { Ref } from '@/types/instructor-course';
import type { Occupation, Preferences, UpdatePreferencesPayload } from '@/types/preferences';

// Onboarding cá nhân hoá (spec 2026-10-02-personalize-occupation §4). Chỉ gọi từ client component.
export const getPreferences = () => api.get<Preferences>('/me/preferences').then((r) => r.data);

export const updatePreferences = (body: UpdatePreferencesPayload) =>
  api.patch<Preferences>('/me/preferences', body).then((r) => r.data);

export const getPopularTopics = (occupation: Occupation, signal?: AbortSignal) =>
  api.get<Ref[]>('/topics/popular', { params: { occupation }, signal }).then((r) => r.data);
