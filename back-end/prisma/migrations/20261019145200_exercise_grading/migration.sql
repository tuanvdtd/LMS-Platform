-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('verdict');

-- DropIndex
DROP INDEX "submission_results_judge0Token_key";

-- AlterTable
ALTER TABLE "exercise_starter_codes" DROP CONSTRAINT "exercise_starter_codes_pkey",
DROP COLUMN "languageId",
ADD COLUMN     "language" TEXT NOT NULL,
ADD CONSTRAINT "exercise_starter_codes_pkey" PRIMARY KEY ("exerciseId", "language");

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "allowedLanguageIds",
DROP COLUMN "instructionsHtml",
DROP COLUMN "totalPoints",
ADD COLUMN     "instructions" TEXT NOT NULL,
ADD COLUMN     "languages" TEXT[];

-- AlterTable
ALTER TABLE "submission_results" DROP COLUMN "judge0Token";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "languageId",
ADD COLUMN     "language" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- [2026-10-19] Bài code chấm bằng Piston (spec coding-exercise §3). DROP COLUMN "allowedLanguageIds" đã kéo theo
-- chk_exercise_languages cũ → tạo lại trên cột mới.
ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (coalesce(cardinality("languages"), 0) >= 1);

-- E13: mỗi học viên chỉ 1 bài đang chờ chấm.
CREATE UNIQUE INDEX uq_submissions_inflight_user ON submissions ("userId")
  WHERE status IN ('pending', 'running');
