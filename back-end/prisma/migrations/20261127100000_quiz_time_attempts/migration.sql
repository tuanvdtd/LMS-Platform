-- Giới hạn thời gian / số lượt của quiz, và lưu đáp án nháp vào quiz_answers khi đang làm.
ALTER TABLE "quizzes" ADD COLUMN "timeLimitMin" INTEGER, ADD COLUMN "maxAttempts" INTEGER;
ALTER TABLE "quiz_attempts" ADD COLUMN "timeLimitMin" INTEGER;
ALTER TABLE "quiz_answers" ALTER COLUMN "isCorrect" DROP NOT NULL;
