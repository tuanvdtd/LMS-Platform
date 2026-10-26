-- Hỏi đáp (spec 2026-10-20-course-qa §2): nội dung Markdown thay cho HTML.
ALTER TABLE "course_questions" RENAME COLUMN "bodyHtml" TO "body";
ALTER TABLE "course_answers" RENAME COLUMN "bodyHtml" TO "body";

ALTER TYPE "NotificationType" ADD VALUE 'qa_answer';
