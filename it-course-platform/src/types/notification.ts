// Khớp NotificationDto của BE (back-end/src/notifications/notifications.service.ts).
// Tên AppNotification để không trùng Notification của DOM.
export type NotificationType = 'verdict' | 'qa_answer';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>; // verdict: { submissionId, status, score }; qa_answer: { questionId, answerId }
  read: boolean;
  createdAt: string;
};

export type NotificationPage = { items: AppNotification[]; nextCursor: string | null; unreadCount: number };
