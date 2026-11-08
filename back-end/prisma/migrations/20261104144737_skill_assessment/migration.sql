-- CreateEnum
CREATE TYPE "SkillDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateTable
CREATE TABLE "skill_questions" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stem" TEXT NOT NULL,
    "difficulty" "SkillDifficulty" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "skill_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ratingBefore" DOUBLE PRECISION NOT NULL,
    "ratingAfter" DOUBLE PRECISION,

    CONSTRAINT "skill_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_answers" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "selectedOptionIds" UUID[] DEFAULT ARRAY[]::UUID[],
    "isCorrect" BOOLEAN,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "userRatingBefore" DOUBLE PRECISION,
    "userRatingAfter" DOUBLE PRECISION,
    "questionRatingBefore" DOUBLE PRECISION,
    "questionRatingAfter" DOUBLE PRECISION,

    CONSTRAINT "skill_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topic_skills" (
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "lastStartedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_topic_skills_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateIndex
CREATE INDEX "skill_questions_topicId_idx" ON "skill_questions"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_question_options_questionId_position_key" ON "skill_question_options"("questionId", "position");

-- CreateIndex
CREATE INDEX "skill_attempts_userId_topicId_startedAt_idx" ON "skill_attempts"("userId", "topicId", "startedAt");

-- CreateIndex
CREATE INDEX "skill_answers_questionId_idx" ON "skill_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_answers_attemptId_position_key" ON "skill_answers"("attemptId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "skill_answers_attemptId_questionId_key" ON "skill_answers"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "user_topic_skills_topicId_idx" ON "user_topic_skills"("topicId");

-- AddForeignKey
ALTER TABLE "skill_questions" ADD CONSTRAINT "skill_questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_question_options" ADD CONSTRAINT "skill_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "skill_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_attempts" ADD CONSTRAINT "skill_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_attempts" ADD CONSTRAINT "skill_attempts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_answers" ADD CONSTRAINT "skill_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "skill_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_answers" ADD CONSTRAINT "skill_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "skill_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_skills" ADD CONSTRAINT "user_topic_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_skills" ADD CONSTRAINT "user_topic_skills_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
--  Bổ sung cho migration skill_assessment (dán vào cuối migration.sql).
--  Prisma không nhìn thấy 2 partial index dưới → đã thêm vào danh sách drift ở README + đầu sql/05.
-- ============================================================================

-- Mỗi học viên + topic chỉ 1 lượt đang làm: 2 request "Bắt đầu" song song → request sau P2002, service trả lượt của request trước.
CREATE UNIQUE INDEX uq_skill_attempt_in_progress ON skill_attempts ("userId", "topicId") WHERE status = 'in_progress';

-- Đếm câu đang dùng theo topic (topic mở khi ≥ 12 câu chưa ẩn).
CREATE INDEX idx_skill_questions_active ON skill_questions ("topicId") WHERE "archivedAt" IS NULL;
