// Khớp NotificationDto của BE (back-end/src/notifications/notifications.service.ts).
// Tên AppNotification để không trùng Notification của DOM.
export type NotificationType = 'verdict' | 'qa_answer' | 'qa_question' | 'course_review' | 'instructor_application' | 'post_comment' | 'course_nudge' | 'payout_account';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>; // verdict: { submissionId, status, score, certificateSerial? }; qa_answer: { questionId, answerId }; qa_question: { questionId }; course_review: { courseId, approvalId, approved }; instructor_application: { applicationId, approved } hoặc kết quả xác minh { identity, approved }; payout_account: {}; post_comment: { postId, commentId, parentId }; course_nudge: { courseId, nudgeId }
  read: boolean;
  createdAt: string;
};

export type NotificationPage = { items: AppNotification[]; nextCursor: string | null; unreadCount: number };
