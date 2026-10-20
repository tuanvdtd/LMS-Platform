-- Chụp đề vào từng lượt làm. Thêm cột cho phép NULL → bù dữ liệu cũ → NOT NULL.
ALTER TABLE "quiz_attempts"
  ADD COLUMN "questionIds" UUID[],
  ADD COLUMN "passScorePct" INTEGER,
  ADD COLUMN "shuffle" BOOLEAN;

-- Lượt đã nộp: mọi câu đều có dòng answer (grade() ghi đủ), id uuid v7 theo thứ tự chấm.
-- Lượt chưa nộp: đề hiện tại theo position.
UPDATE "quiz_attempts" a
SET
  "passScorePct" = q."passScorePct",
  "shuffle" = q."shuffle",
  "questionIds" = CASE
    WHEN a."status" = 'submitted' THEN COALESCE(
      (SELECT array_agg(qa."questionId" ORDER BY qa."id") FROM "quiz_answers" qa WHERE qa."attemptId" = a."id"),
      '{}'
    )
    ELSE COALESCE(
      (SELECT array_agg(x."id" ORDER BY x."position") FROM "questions" x WHERE x."quizId" = a."quizId" AND x."archivedAt" IS NULL),
      '{}'
    )
  END
FROM "quizzes" q
WHERE q."id" = a."quizId";

ALTER TABLE "quiz_attempts"
  ALTER COLUMN "passScorePct" SET NOT NULL,
  ALTER COLUMN "shuffle" SET NOT NULL;
