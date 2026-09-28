CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateEnum
CREATE TYPE "Track" AS ENUM ('backend', 'frontend', 'fullstack', 'mobile', 'data', 'devops', 'other');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('all_levels', 'beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'unlisted', 'archived');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('video', 'article', 'quiz', 'coding');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('course', 'lesson', 'review', 'question');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('copyright', 'inaccurate', 'spam', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'vnpay');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_choice', 'multiple_choice', 'true_false');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'submitted', 'expired');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compile_error', 'internal_error');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('queued', 'sent', 'delivered', 'bounced', 'failed');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT DEFAULT 'student',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "targetTrack" "Track",
    "level" "SkillLevel",

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_applications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "experience" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_profiles" (
    "userId" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "socials" JSONB NOT NULL DEFAULT '{}',
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "course_approvals" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "copyrightNote" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "detail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "handledById" UUID,
    "handledAt" TIMESTAMP(3),
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "promoVideoUrl" TEXT,
    "categoryId" UUID NOT NULL,
    "track" "Track" NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "priceAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "CourseStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "copyrightConfirmedAt" TIMESTAMP(3),
    "ratingAvg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "totalDurationSec" INTEGER NOT NULL DEFAULT 0,
    "lessonCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" vector(1536),
    "searchTsv" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "type" "LessonType" NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "videoAssetId" TEXT,
    "articleBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "orderId" UUID,
    "progressPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "enrollmentId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "watchedSec" INTEGER NOT NULL DEFAULT 0,
    "lastPositionSec" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("enrollmentId","lessonId")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'stripe',
    "providerSessionId" TEXT,
    "providerPaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "platformFeeAmount" INTEGER NOT NULL,
    "instructorEarnAmount" INTEGER NOT NULL,
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderItemId" UUID,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "providerRefundId" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "provider" "PaymentProvider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("provider","eventId")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" "Track",
    "description" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skills" (
    "courseId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "weight" DECIMAL(4,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "course_skills_pkey" PRIMARY KEY ("courseId","skillId")
);

-- CreateTable
CREATE TABLE "user_skill_mastery" (
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "score" DECIMAL(4,3) NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_mastery_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "user_target_skills" (
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_target_skills_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_skills" (
    "questionId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "question_skills_pkey" PRIMARY KEY ("questionId","skillId")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeLimitSec" INTEGER,
    "passScorePct" INTEGER NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "quizId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "pointsOverride" INTEGER,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quizId","questionId")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "scorePct" DECIMAL(5,2),
    "passed" BOOLEAN,
    "timeSpentSec" INTEGER,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "selectedOptionIds" UUID[],
    "isCorrect" BOOLEAN NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 128000,
    "allowedLanguageIds" INTEGER[],
    "referenceSolution" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_starter_codes" (
    "exerciseId" UUID NOT NULL,
    "languageId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "exercise_starter_codes_pkey" PRIMARY KEY ("exerciseId","languageId")
);

-- CreateTable
CREATE TABLE "exercise_test_cases" (
    "id" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "exercise_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_skills" (
    "exerciseId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "exercise_skills_pkey" PRIMARY KEY ("exerciseId","skillId")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "languageId" INTEGER NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "score" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "maxTimeMs" INTEGER,
    "maxMemoryKb" INTEGER,
    "compileError" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_results" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "testCaseId" UUID NOT NULL,
    "judge0Token" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "timeMs" INTEGER,
    "memoryKb" INTEGER,
    "stdoutExcerpt" TEXT,
    "stderrExcerpt" TEXT,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "submission_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "serialNo" TEXT NOT NULL,
    "finalQuizAttemptId" UUID,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_course_daily" (
    "courseId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "cartAdds" INTEGER NOT NULL DEFAULT 0,
    "checkoutsStarted" INTEGER NOT NULL DEFAULT 0,
    "ordersPaid" INTEGER NOT NULL DEFAULT 0,
    "revenueAmount" INTEGER NOT NULL DEFAULT 0,
    "platformFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "refundAmount" INTEGER NOT NULL DEFAULT 0,
    "refundCount" INTEGER NOT NULL DEFAULT 0,
    "newEnrollments" INTEGER NOT NULL DEFAULT 0,
    "activeLearners" INTEGER NOT NULL DEFAULT 0,
    "watchTimeSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stat_course_daily_pkey" PRIMARY KEY ("courseId","date")
);

-- CreateTable
CREATE TABLE "stat_video_buckets" (
    "lessonId" UUID NOT NULL,
    "bucketIndex" INTEGER NOT NULL,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "rewatches" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stat_video_buckets_pkey" PRIMARY KEY ("lessonId","bucketIndex")
);

-- CreateTable
CREATE TABLE "stat_questions" (
    "quizId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "difficultyIndex" DECIMAL(4,3),
    "discriminationIndex" DECIMAL(4,3),
    "optionDistribution" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_questions_pkey" PRIMARY KEY ("quizId","questionId")
);

-- CreateTable
CREATE TABLE "stat_exercises" (
    "exerciseId" UUID NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "acceptanceRate" DECIMAL(4,3),
    "avgAttemptsToAccept" DECIMAL(6,2),
    "statusDistribution" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_exercises_pkey" PRIMARY KEY ("exerciseId")
);

-- CreateTable
CREATE TABLE "stat_student_risk" (
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "riskScore" DECIMAL(4,3) NOT NULL,
    "daysInactive" INTEGER NOT NULL DEFAULT 0,
    "progressDeltaVsMedian" DECIMAL(6,2),
    "avgQuizScore" DECIMAL(5,2),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "stat_student_risk_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SkillPrereq" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_SkillPrereq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "instructor_applications_userId_idx" ON "instructor_applications"("userId");

-- CreateIndex
CREATE INDEX "instructor_applications_status_createdAt_idx" ON "instructor_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "course_approvals_courseId_createdAt_idx" ON "course_approvals"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "course_approvals_status_createdAt_idx" ON "course_approvals"("status", "createdAt");

-- CreateIndex
CREATE INDEX "content_reports_targetType_targetId_idx" ON "content_reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "content_reports_status_createdAt_idx" ON "content_reports"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_position_idx" ON "categories"("parentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- CreateIndex
CREATE INDEX "courses_status_categoryId_level_idx" ON "courses"("status", "categoryId", "level");

-- CreateIndex
CREATE INDEX "courses_status_track_level_idx" ON "courses"("status", "track", "level");

-- CreateIndex
CREATE UNIQUE INDEX "sections_courseId_position_key" ON "sections"("courseId", "position");

-- CreateIndex
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_sectionId_position_key" ON "lessons"("sectionId", "position");

-- CreateIndex
CREATE INDEX "lesson_resources_lessonId_idx" ON "lesson_resources"("lessonId");

-- CreateIndex
CREATE INDEX "course_reviews_courseId_createdAt_idx" ON "course_reviews"("courseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_courseId_userId_key" ON "course_reviews"("courseId", "userId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_userId_lastAccessedAt_idx" ON "enrollments"("userId", "lastAccessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_providerSessionId_key" ON "orders"("providerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_providerPaymentIntentId_key" ON "orders"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_paidAt_idx" ON "orders"("status", "paidAt");

-- CreateIndex
CREATE INDEX "order_items_instructorId_idx" ON "order_items"("instructorId");

-- CreateIndex
CREATE INDEX "order_items_courseId_idx" ON "order_items"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_orderId_courseId_key" ON "order_items"("orderId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");

-- CreateIndex
CREATE INDEX "payment_events_processedAt_idx" ON "payment_events"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_track_idx" ON "skills"("track");

-- CreateIndex
CREATE INDEX "course_skills_skillId_idx" ON "course_skills"("skillId");

-- CreateIndex
CREATE INDEX "user_skill_mastery_userId_score_idx" ON "user_skill_mastery"("userId", "score");

-- CreateIndex
CREATE INDEX "user_target_skills_skillId_idx" ON "user_target_skills"("skillId");

-- CreateIndex
CREATE INDEX "questions_courseId_idx" ON "questions"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_position_key" ON "question_options"("questionId", "position");

-- CreateIndex
CREATE INDEX "question_skills_skillId_idx" ON "question_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_lessonId_key" ON "quizzes"("lessonId");

-- CreateIndex
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quizId_position_key" ON "quiz_questions"("quizId", "position");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_submittedAt_idx" ON "quiz_attempts"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_scorePct_idx" ON "quiz_attempts"("quizId", "scorePct");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quizId_userId_attemptNo_key" ON "quiz_attempts"("quizId", "userId", "attemptNo");

-- CreateIndex
CREATE INDEX "quiz_answers_questionId_isCorrect_idx" ON "quiz_answers"("questionId", "isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answers_attemptId_questionId_key" ON "quiz_answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_lessonId_key" ON "exercises"("lessonId");

-- CreateIndex
CREATE INDEX "exercises_courseId_idx" ON "exercises"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_test_cases_exerciseId_position_key" ON "exercise_test_cases"("exerciseId", "position");

-- CreateIndex
CREATE INDEX "exercise_skills_skillId_idx" ON "exercise_skills"("skillId");

-- CreateIndex
CREATE INDEX "submissions_userId_submittedAt_idx" ON "submissions"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "submissions_exerciseId_status_idx" ON "submissions"("exerciseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "submission_results_judge0Token_key" ON "submission_results"("judge0Token");

-- CreateIndex
CREATE UNIQUE INDEX "submission_results_submissionId_testCaseId_key" ON "submission_results"("submissionId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_serialNo_key" ON "certificates"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_finalQuizAttemptId_key" ON "certificates"("finalQuizAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_userId_courseId_key" ON "certificates"("userId", "courseId");

-- CreateIndex
CREATE INDEX "stat_course_daily_date_idx" ON "stat_course_daily"("date");

-- CreateIndex
CREATE INDEX "stat_student_risk_courseId_riskScore_idx" ON "stat_student_risk"("courseId", "riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_providerMessageId_key" ON "email_logs"("providerMessageId");

-- CreateIndex
CREATE INDEX "email_logs_userId_createdAt_idx" ON "email_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "_SkillPrereq_B_index" ON "_SkillPrereq"("B");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_approvals" ADD CONSTRAINT "course_approvals_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_approvals" ADD CONSTRAINT "course_approvals_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_approvals" ADD CONSTRAINT "course_approvals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_mastery" ADD CONSTRAINT "user_skill_mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_mastery" ADD CONSTRAINT "user_skill_mastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_target_skills" ADD CONSTRAINT "user_target_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_target_skills" ADD CONSTRAINT "user_target_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_skills" ADD CONSTRAINT "question_skills_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_skills" ADD CONSTRAINT "question_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_starter_codes" ADD CONSTRAINT "exercise_starter_codes_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_test_cases" ADD CONSTRAINT "exercise_test_cases_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_skills" ADD CONSTRAINT "exercise_skills_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_skills" ADD CONSTRAINT "exercise_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "exercise_test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_finalQuizAttemptId_fkey" FOREIGN KEY ("finalQuizAttemptId") REFERENCES "quiz_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_course_daily" ADD CONSTRAINT "stat_course_daily_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_video_buckets" ADD CONSTRAINT "stat_video_buckets_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_questions" ADD CONSTRAINT "stat_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_questions" ADD CONSTRAINT "stat_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_exercises" ADD CONSTRAINT "stat_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_student_risk" ADD CONSTRAINT "stat_student_risk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_student_risk" ADD CONSTRAINT "stat_student_risk_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillPrereq" ADD CONSTRAINT "_SkillPrereq_A_fkey" FOREIGN KEY ("A") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillPrereq" ADD CONSTRAINT "_SkillPrereq_B_fkey" FOREIGN KEY ("B") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ============================================================================
--  Phần schema Prisma không diễn tả được.
--
--  Cách áp dụng: dán vào cuối file migration do Prisma sinh ra
--    pnpm prisma migrate dev --create-only --name init
--    cat prisma/sql/01_post_migrate.sql >> prisma/migrations/<ts>_init/migration.sql
--    pnpm prisma migrate dev
--
--  LƯU Ý ĐẶT TÊN: tên bảng là snake_case (do @@map), tên cột là camelCase
--  (mặc định của Prisma) → mọi cột phải để trong nháy kép.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Extension
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
--  2. Ràng buộc toàn vẹn (rẻ hơn và chắc hơn validate ở tầng app)
-- ---------------------------------------------------------------------------
ALTER TABLE course_reviews
  ADD CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE user_skill_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

ALTER TABLE quizzes
  ADD CONSTRAINT chk_pass_score CHECK ("passScorePct" BETWEEN 0 AND 100);

ALTER TABLE orders
  ADD CONSTRAINT chk_order_amounts CHECK (
    "subtotalAmount" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0
    AND "totalAmount" = "subtotalAmount" - "discountAmount"
  );

ALTER TABLE order_items
  ADD CONSTRAINT chk_item_split CHECK (
    "unitPriceAmount" = "platformFeeAmount" + "instructorEarnAmount"
  );

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercise_limits CHECK ("timeLimitMs" > 0 AND "memoryLimitKb" > 0);

-- SkillLevel dùng chung cho user và course, nhưng 'all_levels' chỉ có nghĩa với course.
ALTER TABLE "user"
  ADD CONSTRAINT chk_user_level CHECK (level IS NULL OR level <> 'all_levels');

-- Taxonomy chỉ sâu 2 tầng (Category → Subcategory), không cho lồng sâu hơn.
-- Khoá học phải gắn vào node lá.
ALTER TABLE categories
  ADD CONSTRAINT chk_category_not_self CHECK (id <> "parentId");

CREATE OR REPLACE FUNCTION chk_category_depth() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."parentId" IS NOT NULL
     AND (SELECT "parentId" FROM categories WHERE id = NEW."parentId") IS NOT NULL
  THEN
    RAISE EXCEPTION 'Taxonomy chỉ cho phép 2 tầng';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_category_depth
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION chk_category_depth();

-- Đồ thị kỹ năng tiên quyết không được tự trỏ vào chính nó.
-- Prisma sinh bảng m-n ẩn "_SkillPrereq" với 2 cột "A", "B".
ALTER TABLE "_SkillPrereq"
  ADD CONSTRAINT chk_skill_not_self_prereq CHECK ("A" <> "B");

-- Bài học video phải có asset, bài viết phải có nội dung.
ALTER TABLE lessons
  ADD CONSTRAINT chk_lesson_payload CHECK (
    (type <> 'video'   OR "videoAssetId" IS NOT NULL) AND
    (type <> 'article' OR "articleBody"  IS NOT NULL)
  );

-- ---------------------------------------------------------------------------
--  3. Full-text search tiếng Việt
--  unaccent() không IMMUTABLE nên không dùng trực tiếp trong generated column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Prisma tạo cột tsvector thường; đổi thành GENERATED (không ALTER được, phải drop).
ALTER TABLE courses DROP COLUMN IF EXISTS "searchTsv";
ALTER TABLE courses ADD COLUMN "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(title, ''))),       'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(subtitle, ''))),    'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'C')
  ) STORED;

CREATE INDEX idx_courses_search ON courses USING gin ("searchTsv");
CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops); -- gõ sai chính tả

-- Ô "Tìm kiếm một kỹ năng" ở bước 3 onboarding — autocomplete trên toàn catalog.
CREATE INDEX idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
--  4. pgvector — recommendation tầng 4 (§3.4)
--  Chỉ index khoá đã duyệt: index nhỏ hơn, và query luôn lọc status anyway.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'approved';

-- ---------------------------------------------------------------------------
--  5. Partial index cho các hàng đợi — nhỏ, chỉ chứa việc còn tồn
-- ---------------------------------------------------------------------------
CREATE INDEX idx_payment_events_unprocessed ON payment_events ("receivedAt")
  WHERE "processedAt" IS NULL;

CREATE INDEX idx_submissions_inflight ON submissions ("submittedAt")
  WHERE status IN ('pending', 'running');

CREATE INDEX idx_reports_open ON content_reports ("createdAt")
  WHERE status = 'open';

CREATE INDEX idx_certificates_active ON certificates ("serialNo")
  WHERE "revokedAt" IS NULL;

CREATE INDEX idx_quizzes_final ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- Chỉ có 1 quiz cuối khoá cho mỗi khoá học.
CREATE UNIQUE INDEX uq_one_final_quiz_per_course ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- ---------------------------------------------------------------------------
--  6. Materialized view — cron REFRESH hằng đêm (§4.5, §4.6)
--  Dữ liệu nguồn đã nằm sẵn trong bảng nghiệp vụ nên không cần bảng stat riêng.
-- ---------------------------------------------------------------------------

-- Tầng 3: "Học viên mua khoá này cũng mua…"
CREATE MATERIALIZED VIEW mv_course_copurchase AS
SELECT
  a."courseId" AS course_id,
  b."courseId" AS other_course_id,
  COUNT(*)::int AS co_count
FROM enrollments a
JOIN enrollments b
  ON a."userId" = b."userId"
 AND a."courseId" <> b."courseId"
GROUP BY a."courseId", b."courseId"
HAVING COUNT(*) >= 2 -- bỏ nhiễu: 1 người mua chung không nói lên gì
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_copurchase ON mv_course_copurchase (course_id, other_course_id);
CREATE INDEX idx_mv_copurchase_rank ON mv_course_copurchase (course_id, co_count DESC);

-- §3.5b: "Bài học nào nhiều người dừng lại không học tiếp"
CREATE MATERIALIZED VIEW mv_lesson_dropoff AS
SELECT
  l.id                                        AS lesson_id,
  l."courseId"                                AS course_id,
  l.position,
  COUNT(lp.*)::int                            AS started,
  COUNT(lp."completedAt")::int                AS completed,
  ROUND(
    1 - COUNT(lp."completedAt")::numeric / NULLIF(COUNT(lp.*), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(lp."watchedSec"), 0)::int      AS avg_watched_sec
FROM lessons l
LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id
GROUP BY l.id, l."courseId", l.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_lesson_dropoff ON mv_lesson_dropoff (lesson_id);
CREATE INDEX idx_mv_lesson_dropoff_course ON mv_lesson_dropoff (course_id, position);

-- §3.5b: tỉ lệ hoàn thành khoá + học viên đang hoạt động
CREATE MATERIALIZED VIEW mv_course_completion AS
SELECT
  e."courseId"                                                AS course_id,
  COUNT(*)::int                                               AS enrolled,
  COUNT(e."completedAt")::int                                 AS completed,
  ROUND(COUNT(e."completedAt")::numeric / NULLIF(COUNT(*), 0), 3) AS completion_rate,
  AVG(e."progressPct")                                        AS avg_progress_pct,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '7 days')::int  AS active_7d,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '30 days')::int AS active_30d
FROM enrollments e
GROUP BY e."courseId"
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_course_completion ON mv_course_completion (course_id);

-- Cron gọi hàm này mỗi đêm. CONCURRENTLY để dashboard không bị khoá khi refresh
-- (đòi hỏi unique index ở trên, đã có).
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lesson_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

-- Lần đầu phải refresh không CONCURRENTLY vì view đang WITH NO DATA.
REFRESH MATERIALIZED VIEW mv_course_copurchase;
REFRESH MATERIALIZED VIEW mv_lesson_dropoff;
REFRESH MATERIALIZED VIEW mv_course_completion;

-- ---------------------------------------------------------------------------
--  7. Seed taxonomy — phần IT của Udemy, bỏ Hardware và "Other"
--  courses."categoryId" NOT NULL nên phải chạy trước khi tạo khoá học đầu tiên.
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, "parentId", slug, name, position) VALUES
  (gen_random_uuid(), NULL, 'lap-trinh',        'Lập trình',         1),
  (gen_random_uuid(), NULL, 'khoa-hoc-du-lieu', 'Khoa học dữ liệu',  2),
  (gen_random_uuid(), NULL, 'cntt-ha-tang',     'CNTT & Hạ tầng',    3);

INSERT INTO categories (id, "parentId", slug, name, position)
SELECT gen_random_uuid(), p.id, s.slug, s.name, s.position
FROM (VALUES
  ('lap-trinh',        'web',              'Phát triển Web',            1),
  ('lap-trinh',        'mobile',           'Phát triển Mobile',         2),
  ('lap-trinh',        'ngon-ngu',         'Ngôn ngữ lập trình',        3),
  ('lap-trinh',        'co-so-du-lieu',    'Cơ sở dữ liệu',             4),
  ('lap-trinh',        'game',             'Lập trình Game',            5),
  ('lap-trinh',        'kiem-thu',         'Kiểm thử phần mềm',         6),
  ('lap-trinh',        'ky-thuat-pm',      'Kỹ thuật phần mềm',         7),
  ('lap-trinh',        'cong-cu',          'Công cụ lập trình',         8),
  ('khoa-hoc-du-lieu', 'data-science',     'Data Science',              1),
  ('khoa-hoc-du-lieu', 'phan-tich-du-lieu','Phân tích dữ liệu',         2),
  ('khoa-hoc-du-lieu', 'ai-ml',            'AI & Machine Learning',     3),
  ('cntt-ha-tang',     'devops-cloud',     'DevOps & Cloud',            1),
  ('cntt-ha-tang',     'mang-bao-mat',     'Mạng & Bảo mật',            2),
  ('cntt-ha-tang',     'he-dieu-hanh',     'Hệ điều hành & Máy chủ',    3),
  ('cntt-ha-tang',     'chung-chi',        'Chứng chỉ CNTT',            4)
) AS s(parent_slug, slug, name, position)
JOIN categories p ON p.slug = s.parent_slug;

