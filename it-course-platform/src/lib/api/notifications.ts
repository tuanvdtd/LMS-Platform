// src/lib/api/notifications.ts — Thông báo của tôi. Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { NotificationPage, NotificationType } from '@/types/notification';

export const listNotifications = (params: { cursor?: string; type?: NotificationType } = {}) =>
  api.get<NotificationPage>('/notifications', { params }).then((r) => r.data);
export const markNotificationRead = (id: string) => api.post(`/notifications/${id}/read`).then(() => undefined);
export const markAllNotificationsRead = () => api.post('/notifications/read-all').then(() => undefined);
export const deleteNotification = (id: string) => api.delete(`/notifications/${id}`).then(() => undefined);
