-- CreateEnum
CREATE TYPE "CourseEventKind" AS ENUM ('page_view', 'cart_add');

-- DropForeignKey
ALTER TABLE "stat_course_daily" DROP CONSTRAINT "stat_course_daily_courseId_fkey";

-- DropForeignKey
ALTER TABLE "stat_video_buckets" DROP CONSTRAINT "stat_video_buckets_itemId_fkey";

-- DropTable
DROP TABLE "stat_course_daily";

-- DropTable
DROP TABLE "stat_video_buckets";

-- CreateTable
CREATE TABLE "course_events" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "kind" "CourseEventKind" NOT NULL,
    "userId" UUID,
    "visitorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_watch_segments" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "viewId" UUID NOT NULL,
    "seq" SMALLINT NOT NULL,
    "startSec" INTEGER NOT NULL,
    "endSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_watch_segments_pkey" PRIMARY KEY ("id")
);

-- CheckConstraint
ALTER TABLE "video_watch_segments" ADD CONSTRAINT "chk_watch_segment_range" CHECK ("startSec" >= 0 AND "startSec" < "endSec");

-- CreateIndex
CREATE INDEX "course_events_courseId_createdAt_idx" ON "course_events"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "video_watch_segments_itemId_idx" ON "video_watch_segments"("itemId");

-- CreateIndex
CREATE INDEX "video_watch_segments_enrollmentId_createdAt_idx" ON "video_watch_segments"("enrollmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "course_events" ADD CONSTRAINT "course_events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_events" ADD CONSTRAINT "course_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_watch_segments" ADD CONSTRAINT "video_watch_segments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_watch_segments" ADD CONSTRAINT "video_watch_segments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "curriculum_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

