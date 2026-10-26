// src/types/qa.ts — khớp DTO của back-end/src/qa. Câu hỏi và trả lời đều là 1 ô Markdown kiểu bình luận.
export const QA_BODY_MAX = 2000;

export type QaAuthor = { id: string; name: string; image: string | null };

export interface Answer {
  id: string;
  body: string;
  createdAt: string;
  author: QaAuthor;
  isInstructor: boolean;
  replyTo: { id: string; name: string } | null; // trả lời một câu trả lời khác → "Trả lời <tên>"
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
