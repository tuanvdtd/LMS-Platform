// Khớp NotificationDto của BE (back-end/src/notifications/notifications.service.ts).
// Tên AppNotification để không trùng Notification của DOM.
export type NotificationType = 'verdict' | 'qa_answer' | 'course_review' | 'instructor_application';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>; // verdict: { submissionId, status, score, certificateSerial? }; qa_answer: { questionId, answerId }; course_review: { courseId, approvalId, approved }; instructor_application: { applicationId, approved }
  read: boolean;
  createdAt: string;
};

export type NotificationPage = { items: AppNotification[]; nextCursor: string | null; unreadCount: number };
