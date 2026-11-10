// src/types/qa.ts — khớp DTO của back-end/src/qa. Câu hỏi và trả lời đều là 1 ô Markdown kiểu bình luận.
export const QA_BODY_MAX = 2000;

export type QaAuthor = { id: string; name: string; image: string | null };

export interface Answer {
  id: string;
  body: string;
  createdAt: string;
  author: QaAuthor;
  isInstructor: boolean;
  // Trả lời một câu trả lời khác → "@Tên". id/name: người được trả lời.
  // answerId: bình luận được trả lời (bấm "@Tên" để cuộn tới); null = đã bị xoá hoặc dữ liệu cũ chỉ lưu người.
  replyTo: { id: string; name: string; answerId: string | null } | null;
  canDelete: boolean;
}

export interface Question {
  id: string;
  body: string;
  createdAt: string;
  item: { id: string; title: string } | null;
  course: { id: string; title: string; slug: string };
  author: QaAuthor;
  canDelete: boolean;
  answers: Answer[];
}

export type QuestionPage = { items: Question[]; total: number; nextCursor: string | null };
