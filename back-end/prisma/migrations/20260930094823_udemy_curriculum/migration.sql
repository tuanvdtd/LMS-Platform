-- Thêm tay (spec §6.3): object phụ thuộc bảng/enum sắp đổi.
DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;
DROP INDEX IF EXISTS idx_courses_embedding;

-- CreateEnum
CREATE TYPE "CurriculumItemType" AS ENUM ('lecture', 'quiz', 'practice_test', 'coding_exercise');

-- CreateEnum
CREATE TYPE "LectureKind" AS ENUM ('video', 'document');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('video', 'document');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('fixed_price', 'free');

-- AlterEnum
BEGIN;
CREATE TYPE "CourseStatus_new" AS ENUM ('draft', 'in_review', 'published', 'unpublished');
ALTER TABLE "public"."courses" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "courses" ALTER COLUMN "status" TYPE "CourseStatus_new" USING ("status"::text::"CourseStatus_new");
ALTER TYPE "CourseStatus" RENAME TO "CourseStatus_old";
ALTER TYPE "CourseStatus_new" RENAME TO "CourseStatus";
DROP TYPE "public"."CourseStatus_old";
ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('single_choice', 'multiple_choice');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportTargetType_new" AS ENUM ('course', 'item', 'review', 'quiz_question', 'qa_question', 'qa_answer');
ALTER TABLE "content_reports" ALTER COLUMN "targetType" TYPE "ReportTargetType_new" USING ("targetType"::text::"ReportTargetType_new");
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
ALTER TYPE "ReportTargetType_new" RENAME TO "ReportTargetType";
DROP TYPE "public"."ReportTargetType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "exercises" DROP CONSTRAINT "exercises_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_progress" DROP CONSTRAINT "lesson_progress_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_progress" DROP CONSTRAINT "lesson_progress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_resources" DROP CONSTRAINT "lesson_resources_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_courseId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_courseId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "stat_questions" DROP CONSTRAINT "stat_questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "stat_video_buckets" DROP CONSTRAINT "stat_video_buckets_lessonId_fkey";

-- DropIndex
DROP INDEX "exercises_lessonId_key";

-- DropIndex
DROP INDEX "questions_courseId_idx";

-- DropIndex
DROP INDEX "quizzes_lessonId_key";

-- DropIndex
DROP INDEX "sections_courseId_position_key";

-- AlterTable
ALTER TABLE "course_reviews" ADD COLUMN     "instructorRepliedAt" TIMESTAMP(3),
ADD COLUMN     "instructorReply" TEXT;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "lessonCount",
ADD COLUMN     "congratsMessage" TEXT,
ADD COLUMN     "learningObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lectureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qaEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAudience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "welcomeMessage" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "couponId" UUID;

-- AlterTable
ALTER TABLE "exercise_starter_codes" ADD COLUMN     "solutionCode" TEXT;

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "lessonId",
DROP COLUMN "referenceSolution",
DROP COLUMN "statement",
DROP COLUMN "title",
ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "instructionsHtml" TEXT NOT NULL,
ADD COLUMN     "itemId" UUID NOT NULL,
ADD COLUMN     "learningObjective" TEXT,
ADD COLUMN     "relatedItemId" UUID,
ADD COLUMN     "solutionExplanation" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "couponId" UUID,
ADD COLUMN     "listPriceAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "question_options" ADD COLUMN     "explanation" TEXT;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "courseId",
DROP COLUMN "createdById",
DROP COLUMN "explanation",
DROP COLUMN "stem",
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "quizId" UUID NOT NULL,
ADD COLUMN     "relatedItemId" UUID,
ADD COLUMN     "stemHtml" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "lessonId",
DROP COLUMN "title",
ADD COLUMN     "itemId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "stat_questions" DROP CONSTRAINT "stat_questions_pkey",
DROP COLUMN "quizId",
ADD CONSTRAINT "stat_questions_pkey" PRIMARY KEY ("questionId");

-- AlterTable
ALTER TABLE "stat_video_buckets" DROP CONSTRAINT "stat_video_buckets_pkey",
DROP COLUMN "lessonId",
ADD COLUMN     "itemId" UUID NOT NULL,
ADD CONSTRAINT "stat_video_buckets_pkey" PRIMARY KEY ("itemId", "bucketIndex");

-- DropTable
DROP TABLE "lesson_progress";

-- DropTable
DROP TABLE "lesson_resources";

-- DropTable
DROP TABLE "lessons";

-- DropTable
DROP TABLE "quiz_questions";

-- DropEnum
DROP TYPE "LessonType";

-- CreateTable
CREATE TABLE "curriculum_items" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "type" "CurriculumItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "lectureKind" "LectureKind",
    "videoAssetId" UUID,
    "documentAssetId" UUID,
    "description" TEXT,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "hlsKey" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'uploading',
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_resources" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "lecture_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_progress" (
    "enrollmentId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "watchedSec" INTEGER NOT NULL DEFAULT 0,
    "lastPositionSec" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_progress_pkey" PRIMARY KEY ("enrollmentId","itemId")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "priceAmount" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "positionSec" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_questions" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "itemId" UUID,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "instructorAnsweredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_answers" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "isInstructor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_items_courseId_idx" ON "curriculum_items"("courseId");

-- CreateIndex
CREATE INDEX "curriculum_items_videoAssetId_idx" ON "curriculum_items"("videoAssetId");

-- CreateIndex
CREATE INDEX "curriculum_items_documentAssetId_idx" ON "curriculum_items"("documentAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_storageKey_key" ON "assets"("storageKey");

-- CreateIndex
CREATE INDEX "assets_ownerId_createdAt_idx" ON "assets"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "lecture_resources_assetId_idx" ON "lecture_resources"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_resources_itemId_position_key" ON "lecture_resources"("itemId", "position");

-- CreateIndex
CREATE INDEX "item_progress_itemId_idx" ON "item_progress"("itemId");

-- CreateIndex
CREATE INDEX "coupons_courseId_createdAt_idx" ON "coupons"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "coupons_createdById_idx" ON "coupons"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_courseId_code_key" ON "coupons"("courseId", "code");

-- CreateIndex
CREATE INDEX "announcements_courseId_createdAt_idx" ON "announcements"("courseId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

-- CreateIndex
CREATE INDEX "notes_enrollmentId_itemId_positionSec_idx" ON "notes"("enrollmentId", "itemId", "positionSec");

-- CreateIndex
CREATE INDEX "notes_itemId_idx" ON "notes"("itemId");

-- CreateIndex
CREATE INDEX "course_questions_courseId_createdAt_idx" ON "course_questions"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "course_questions_itemId_idx" ON "course_questions"("itemId");

-- CreateIndex
CREATE INDEX "course_questions_userId_idx" ON "course_questions"("userId");

-- CreateIndex
CREATE INDEX "course_answers_questionId_createdAt_idx" ON "course_answers"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "course_answers_userId_idx" ON "course_answers"("userId");

-- CreateIndex
CREATE INDEX "enrollments_couponId_idx" ON "enrollments"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_itemId_key" ON "exercises"("itemId");

-- CreateIndex
CREATE INDEX "exercises_relatedItemId_idx" ON "exercises"("relatedItemId");

-- CreateIndex
CREATE INDEX "order_items_couponId_idx" ON "order_items"("couponId");

-- CreateIndex
CREATE INDEX "questions_relatedItemId_idx" ON "questions"("relatedItemId");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_itemId_key" ON "quizzes"("itemId");

-- AddForeignKey
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_documentAssetId_fkey" FOREIGN KEY ("documentAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_resources" ADD CONSTRAINT "lecture_resources_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_resources" ADD CONSTRAINT "lecture_resources_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_progress" ADD CONSTRAINT "item_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_progress" ADD CONSTRAINT "item_progress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_relatedItemId_fkey" FOREIGN KEY ("relatedItemId") REFERENCES "curriculum_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_relatedItemId_fkey" FOREIGN KEY ("relatedItemId") REFERENCES "curriculum_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_video_buckets" ADD CONSTRAINT "stat_video_buckets_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "course_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_answers" ADD CONSTRAINT "course_answers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
--  Bổ sung cho migration udemy_curriculum (spec 2026-09-30-udemy-curriculum-schema §5).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
--  ĐẦU migration.sql phải có (thêm tay, trước mọi lệnh Prisma sinh):
--    DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;   -- phụ thuộc bảng lessons
--    DROP INDEX IF EXISTS idx_courses_embedding;           -- WHERE status = 'approved' chặn đổi enum
--
--  CẢNH BÁO drift — danh sách ĐẦY ĐỦ object viết tay mà Prisma không biết (thay danh sách ở 03).
--  `prisma migrate dev` có thể sinh DROP cho chúng. Luôn `--create-only`, xoá mọi câu lệnh động tới:
--    idx_courses_embedding, uq_course_primary_topic,
--    uq_sections_position, uq_items_position, uq_questions_position, idx_qa_unanswered,
--    idx_quizzes_final, uq_one_final_quiz_per_course, idx_certificates_active,
--    idx_submissions_inflight, idx_reports_open, idx_payment_events_unprocessed (partial index ở init),
--    các CHECK chk_* (Prisma không quản lý CHECK), mv_* (materialized view).
--  (idx_courses_search, idx_courses_title_trgm, searchTsv đã drop ở drop_pg_fulltext;
--   idx_topics_name_trgm do Prisma quản lý.)
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Unique DEFERRABLE — kéo thả đổi chỗ trong một transaction (spec D5)
-- ---------------------------------------------------------------------------
ALTER TABLE sections ADD CONSTRAINT uq_sections_position
  UNIQUE ("courseId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE curriculum_items ADD CONSTRAINT uq_items_position
  UNIQUE ("sectionId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE questions ADD CONSTRAINT uq_questions_position
  UNIQUE ("quizId", position) DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
--  2. CHECK
--  Mọi so sánh trên cột nullable dùng IS [NOT] DISTINCT FROM / coalesce:
--  CHECK trả NULL được coi là ĐẠT, nên "NULL = 'video'" sẽ lọt.
-- ---------------------------------------------------------------------------

-- Lecture: chưa có nội dung (không được xuất bản) | video | document. Loại khác: không có cột lecture.
ALTER TABLE curriculum_items ADD CONSTRAINT chk_item_payload CHECK (
  CASE WHEN type = 'lecture' THEN
       ("lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
        AND NOT "isPublished")
    OR ("lectureKind" IS NOT DISTINCT FROM 'video'
        AND "videoAssetId" IS NOT NULL AND "documentAssetId" IS NULL)
    OR ("lectureKind" IS NOT DISTINCT FROM 'document'
        AND "documentAssetId" IS NOT NULL AND "videoAssetId" IS NULL)
  ELSE "lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
  END
);

ALTER TABLE assets ADD CONSTRAINT chk_asset_pdf
  CHECK (kind <> 'document' OR "mimeType" = 'application/pdf');

ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (cardinality("allowedLanguageIds") >= 1);

ALTER TABLE courses ADD CONSTRAINT chk_course_price CHECK ("priceAmount" >= 0);

ALTER TABLE coupons
  ADD CONSTRAINT chk_coupon_code CHECK (code ~ '^[A-Z0-9_-]{6,20}$'),
  ADD CONSTRAINT chk_coupon_price CHECK (
       (type = 'fixed_price' AND coalesce("priceAmount", 0) > 0)
    OR (type = 'free' AND "priceAmount" IS NULL)
  ),
  ADD CONSTRAINT chk_coupon_window CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT chk_coupon_redemptions CHECK (
    "redeemedCount" >= 0
    AND ("maxRedemptions" IS NULL OR ("maxRedemptions" > 0 AND "redeemedCount" <= "maxRedemptions"))
    AND (type <> 'free' OR "maxRedemptions" IS NOT NULL)
  );

ALTER TABLE order_items ADD CONSTRAINT chk_order_item_list_price
  CHECK ("listPriceAmount" >= "unitPriceAmount");

ALTER TABLE notes ADD CONSTRAINT chk_note_position CHECK ("positionSec" >= 0);

-- ---------------------------------------------------------------------------
--  3. Partial index
-- ---------------------------------------------------------------------------
-- Tạo lại (drop ở đầu migration): chỉ index khoá đang bán.
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'published';

-- Dashboard giảng viên: câu hỏi chưa có giảng viên trả lời.
CREATE INDEX idx_qa_unanswered ON course_questions ("courseId", "createdAt")
  WHERE "instructorAnsweredAt" IS NULL;

-- ---------------------------------------------------------------------------
--  4. Materialized view — thay mv_lesson_dropoff (§3.5b: bài nào nhiều người bỏ dở)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_item_dropoff AS
SELECT
  i.id                                        AS item_id,
  i."courseId"                                AS course_id,
  s.position                                  AS section_position,
  i.position,
  COUNT(p."itemId")::int                      AS started,
  COUNT(p."completedAt")::int                 AS completed,
  ROUND(
    1 - COUNT(p."completedAt")::numeric / NULLIF(COUNT(p."itemId"), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(p."watchedSec"), 0)::int       AS avg_watched_sec
FROM curriculum_items i
JOIN sections s ON s.id = i."sectionId"
LEFT JOIN item_progress p ON p."itemId" = i.id
WHERE i.type = 'lecture'
GROUP BY i.id, i."courseId", s.position, i.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_item_dropoff ON mv_item_dropoff (item_id);
CREATE INDEX idx_mv_item_dropoff_course ON mv_item_dropoff (course_id, section_position, position);

-- Giữ tên hàm: job pg_cron (nếu có) không phải sửa.
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_item_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

REFRESH MATERIALIZED VIEW mv_item_dropoff;
