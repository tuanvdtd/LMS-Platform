import { api } from '@/lib/api/client';
import type { RecommendationGroup } from '@/types/recommendations';

// Chỉ gọi từ client component (cần cookie phiên).
export const getRecommendations = () =>
  api.get<{ groups: RecommendationGroup[] }>('/me/recommendations').then((r) => r.data.groups);
