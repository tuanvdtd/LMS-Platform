-- Hỏi đáp kiểu bình luận (UI của sếp): câu hỏi 1 ô nội dung; trả lời có thể nhắc người được trả lời.
UPDATE "course_questions" SET "body" = CASE WHEN "body" IS NULL OR "body" = '' THEN "title" ELSE "title" || E'\n\n' || "body" END;
ALTER TABLE "course_questions" ALTER COLUMN "body" SET NOT NULL;
ALTER TABLE "course_questions" DROP COLUMN "title";

ALTER TABLE "course_answers" ADD COLUMN "replyToUserId" UUID;
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_replyToUserId_fkey" FOREIGN KEY ("replyToUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
