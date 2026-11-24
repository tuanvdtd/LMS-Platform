// src/lib/api/messages.ts — Tin nhắn. Chỉ gọi từ client component.
import { api } from '@/lib/api/client';
import type { ConversationDetail, ConversationPage, MessageDto, MessagePage } from '@/types/message';

export const listConversations = (params: { cursor?: string; q?: string } = {}) => api.get<ConversationPage>('/conversations', { params }).then((r) => r.data);
export const getUnreadCount = () => api.get<{ count: number }>('/conversations/unread-count').then((r) => r.data.count);
export const getPeer = (userId: string) => api.get<{ conversationId: string | null; canMessage: boolean }>(`/conversations/peer/${userId}`).then((r) => r.data);
export const openConversation = (userId: string) => api.post<{ id: string }>('/conversations', { userId }).then((r) => r.data.id);
export const getConversation = (id: string) => api.get<ConversationDetail>(`/conversations/${id}`).then((r) => r.data);
export const listMessages = (id: string, before?: string) => api.get<MessagePage>(`/conversations/${id}/messages`, { params: { before } }).then((r) => r.data);
export const sendMessage = (id: string, body: { body: string; imageKeys: string[] }) => api.post<MessageDto>(`/conversations/${id}/messages`, body).then((r) => r.data);
export const markConversationRead = (id: string) => api.post(`/conversations/${id}/read`).then(() => undefined);
export const blockConversation = (id: string) => api.post(`/conversations/${id}/block`).then(() => undefined);
export const unblockConversation = (id: string) => api.delete(`/conversations/${id}/block`).then(() => undefined);
export const requestImageUpload = (id: string, body: { mimeType: string; sizeBytes: number }) =>
  api.post<{ key: string; uploadUrl: string }>(`/conversations/${id}/images`, body).then((r) => r.data);
