import { api } from '@/lib/api/client';
import type { MyProfile, UpdateProfilePayload } from '@/types/profile';

// Hồ sơ của chính mình (tab Hồ sơ ở /settings). Chỉ gọi từ client component.
// Trang công khai /u/[id] đọc bằng getProfile trong lib/api/catalog.ts (server, có cache).
export const getMyProfile = () => api.get<MyProfile>('/me/profile').then((r) => r.data);

export const updateMyProfile = (body: UpdateProfilePayload) =>
  api.patch<MyProfile>('/me/profile', body).then((r) => r.data);
