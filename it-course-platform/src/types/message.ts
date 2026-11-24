// src/types/message.ts — Kiểu dữ liệu tin nhắn, khớp DTO của back-end/src/messages.
export type BlockedState = 'none' | 'me' | 'other';
export type CannotSend = 'BLOCKED_BY_ME' | 'BLOCKED_BY_OTHER' | 'NO_PAID_LINK';

export interface MessageUser { id: string; name: string; image: string | null }
export interface MessageDto { id: string; conversationId: string; senderId: string; body: string; images: { key: string; url: string }[]; createdAt: string }

export interface ConversationListItem {
  id: string;
  other: MessageUser;
  lastMessage: { body: string; hasImages: boolean; senderIsMe: boolean; createdAt: string } | null;
  unreadCount: number;
  blocked: BlockedState;
}
export interface ConversationPage { items: ConversationListItem[]; nextCursor: string | null }

export interface ConversationCourse {
  id: string;
  title: string;
  slug: string;
  otherIsStudent: boolean;
  progressPct: number | null;
  lastAccessedAt: string | null;
  review: { rating: number; comment: string | null; createdAt: string } | null;
}
export interface ConversationDetail {
  id: string;
  other: MessageUser;
  canSend: boolean;
  reason: CannotSend | null;
  blocked: BlockedState;
  otherLastReadAt: string | null;
  courses: ConversationCourse[];
}
export interface MessagePage { items: MessageDto[]; hasMore: boolean }

export type MessageEvent =
  | { type: 'message:new'; conversationId: string; message: MessageDto }
  | { type: 'conversation:read'; conversationId: string; userId: string; readAt: string }
  | { type: 'conversation:updated'; conversationId: string }
  | { type: 'reconnect' };
