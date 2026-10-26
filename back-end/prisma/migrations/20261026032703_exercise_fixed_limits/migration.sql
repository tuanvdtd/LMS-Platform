-- Mốc chạy code cố định theo ngôn ngữ trong code-runner.ts; CHECK chk_exercise_limits tự bị bỏ theo cột.
ALTER TABLE "exercises" DROP COLUMN "memoryLimitKb",
DROP COLUMN "timeLimitMs";
