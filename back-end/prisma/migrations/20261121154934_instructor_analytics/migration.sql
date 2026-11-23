-- Dashboard giảng viên gói 1: bảng nhắc học viên (course_nudges), loại thông báo course_nudge.
-- Bỏ 3 bảng stat_* không code nào dùng: chất lượng câu hỏi, bài code, nguy cơ bỏ học tính trực tiếp từ dữ liệu gốc (src/analytics).
-- Đã bỏ khỏi bản migrate diff: 3 DROP INDEX uq_*_position (drift đã biết, README) và DROP 4 cột cũ của instructor_profiles
-- (merge_profile_identity cố ý giữ vì database dùng chung với bản đang chạy).

-- CreateEnum
CREATE TYPE "NudgeKind" AS ENUM ('reminder', 'encourage');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'course_nudge';

-- DropForeignKey
ALTER TABLE "stat_exercises" DROP CONSTRAINT "stat_exercises_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "stat_questions" DROP CONSTRAINT "stat_questions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "stat_student_risk" DROP CONSTRAINT "stat_student_risk_courseId_fkey";

-- DropForeignKey
ALTER TABLE "stat_student_risk" DROP CONSTRAINT "stat_student_risk_userId_fkey";

-- DropTable
DROP TABLE "stat_exercises";

-- DropTable
DROP TABLE "stat_questions";

-- DropTable
DROP TABLE "stat_student_risk";

-- CreateTable
CREATE TABLE "course_nudges" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "NudgeKind" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_nudges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_nudges_courseId_userId_createdAt_idx" ON "course_nudges"("courseId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "course_nudges_instructorId_idx" ON "course_nudges"("instructorId");

-- CreateIndex
CREATE INDEX "course_nudges_userId_idx" ON "course_nudges"("userId");

-- AddForeignKey
ALTER TABLE "course_nudges" ADD CONSTRAINT "course_nudges_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_nudges" ADD CONSTRAINT "course_nudges_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_nudges" ADD CONSTRAINT "course_nudges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
