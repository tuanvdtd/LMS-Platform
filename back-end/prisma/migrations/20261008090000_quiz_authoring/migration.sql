-- Spec 2026-10-08-quiz-authoring: bỏ quiz cuối khoá (chứng chỉ = học hết khoá), bỏ giới hạn thời gian/số lần,
-- đề bài là Markdown. Các bảng đang rỗng.
DROP INDEX IF EXISTS idx_quizzes_final;
DROP INDEX IF EXISTS uq_one_final_quiz_per_course;

ALTER TABLE "quizzes" DROP COLUMN "isFinal", DROP COLUMN "timeLimitSec", DROP COLUMN "maxAttempts";

ALTER TABLE "questions" RENAME COLUMN "stemHtml" TO "stem";

-- DROP COLUMN kéo theo unique index + FK của cột.
ALTER TABLE "certificates" DROP COLUMN "finalQuizAttemptId";
