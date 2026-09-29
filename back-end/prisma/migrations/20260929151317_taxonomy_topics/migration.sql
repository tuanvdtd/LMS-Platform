/*
  Warnings:

  - You are about to drop the `_SkillPrereq` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exercise_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_skill_mastery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_target_skills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SkillPrereq" DROP CONSTRAINT "_SkillPrereq_A_fkey";

-- DropForeignKey
ALTER TABLE "_SkillPrereq" DROP CONSTRAINT "_SkillPrereq_B_fkey";

-- DropForeignKey
ALTER TABLE "course_skills" DROP CONSTRAINT "course_skills_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_skills" DROP CONSTRAINT "course_skills_skillId_fkey";

-- DropForeignKey
ALTER TABLE "exercise_skills" DROP CONSTRAINT "exercise_skills_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "exercise_skills" DROP CONSTRAINT "exercise_skills_skillId_fkey";

-- DropForeignKey
ALTER TABLE "question_skills" DROP CONSTRAINT "question_skills_questionId_fkey";

-- DropForeignKey
ALTER TABLE "question_skills" DROP CONSTRAINT "question_skills_skillId_fkey";

-- DropForeignKey
ALTER TABLE "user_skill_mastery" DROP CONSTRAINT "user_skill_mastery_skillId_fkey";

-- DropForeignKey
ALTER TABLE "user_skill_mastery" DROP CONSTRAINT "user_skill_mastery_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_target_skills" DROP CONSTRAINT "user_target_skills_skillId_fkey";

-- DropForeignKey
ALTER TABLE "user_target_skills" DROP CONSTRAINT "user_target_skills_userId_fkey";

-- DropTable
DROP TABLE "_SkillPrereq";

-- DropTable
DROP TABLE "course_skills";

-- DropTable
DROP TABLE "exercise_skills";

-- DropTable
DROP TABLE "question_skills";

-- DropTable
DROP TABLE "skills";

-- DropTable
DROP TABLE "user_skill_mastery";

-- DropTable
DROP TABLE "user_target_skills";

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_topics" (
    "courseId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_topics_pkey" PRIMARY KEY ("courseId","topicId")
);

-- CreateTable
CREATE TABLE "user_topic_mastery" (
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "score" DECIMAL(4,3) NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_topic_mastery_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "user_target_topics" (
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_target_topics_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "quiz_topics" (
    "quizId" UUID NOT NULL,
    "topicId" UUID NOT NULL,

    CONSTRAINT "quiz_topics_pkey" PRIMARY KEY ("quizId","topicId")
);

-- CreateTable
CREATE TABLE "exercise_topics" (
    "exerciseId" UUID NOT NULL,
    "topicId" UUID NOT NULL,

    CONSTRAINT "exercise_topics_pkey" PRIMARY KEY ("exerciseId","topicId")
);

-- CreateTable
CREATE TABLE "_TopicPrereq" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TopicPrereq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "course_topics_topicId_idx" ON "course_topics"("topicId");

-- CreateIndex
CREATE INDEX "user_topic_mastery_userId_score_idx" ON "user_topic_mastery"("userId", "score");

-- CreateIndex
CREATE INDEX "user_target_topics_topicId_idx" ON "user_target_topics"("topicId");

-- CreateIndex
CREATE INDEX "quiz_topics_topicId_idx" ON "quiz_topics"("topicId");

-- CreateIndex
CREATE INDEX "exercise_topics_topicId_idx" ON "exercise_topics"("topicId");

-- CreateIndex
CREATE INDEX "_TopicPrereq_B_index" ON "_TopicPrereq"("B");

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_mastery" ADD CONSTRAINT "user_topic_mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_mastery" ADD CONSTRAINT "user_topic_mastery_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_target_topics" ADD CONSTRAINT "user_target_topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_target_topics" ADD CONSTRAINT "user_target_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_topics" ADD CONSTRAINT "quiz_topics_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_topics" ADD CONSTRAINT "quiz_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_topics" ADD CONSTRAINT "exercise_topics_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_topics" ADD CONSTRAINT "exercise_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopicPrereq" ADD CONSTRAINT "_TopicPrereq_A_fkey" FOREIGN KEY ("A") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopicPrereq" ADD CONSTRAINT "_TopicPrereq_B_fkey" FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ============================================================================
--  Bổ sung cho migration taxonomy_topics (spec 2026-09-29-udemy-taxonomy-topics §3.3).
--  Prisma DROP các bảng skill cũ nên constraint/index tạo ở 01_post_migrate.sql
--  mất theo, phải tạo lại trên bảng topic mới.
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
-- ============================================================================

ALTER TABLE user_topic_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

-- Bảng m-n ẩn của Prisma cho relation "TopicPrereq", 2 cột "A", "B".
ALTER TABLE "_TopicPrereq"
  ADD CONSTRAINT chk_topic_not_self_prereq CHECK ("A" <> "B");

-- Ô "Tìm kiếm topic" ở bước 3 onboarding: autocomplete trên toàn catalog.
CREATE INDEX idx_topics_name_trgm ON topics USING gin (name gin_trgm_ops);

-- Mỗi khoá tối đa 1 topic chính. "Đúng 1 khi publish" kiểm ở service publish.
CREATE UNIQUE INDEX uq_course_primary_topic ON course_topics ("courseId") WHERE "isPrimary";
