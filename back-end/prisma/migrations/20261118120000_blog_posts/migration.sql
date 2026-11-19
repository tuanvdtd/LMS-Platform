-- Blog: bài viết của giảng viên và admin. Chỉ thêm mới, không đụng bảng cũ.
-- Viết tay từ `prisma migrate diff` (bỏ các DROP INDEX uq_*_position và DROP COLUMN instructor_profiles
-- không thuộc blog: đó là index/cột tồn tại trong DB mà schema không mô tả).

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published', 'removed');

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "slug" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT,
    "autoExcerpt" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "readingMinutes" INTEGER NOT NULL DEFAULT 1,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "relatedCourseId" UUID,
    "publishedAt" TIMESTAMP(3),
    "removedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_topics" (
    "postId" UUID NOT NULL,
    "topicId" UUID NOT NULL,

    CONSTRAINT "post_topics_pkey" PRIMARY KEY ("postId","topicId")
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_status_publishedAt_idx" ON "posts"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "posts_authorId_status_idx" ON "posts"("authorId", "status");

-- CreateIndex
CREATE INDEX "post_topics_topicId_idx" ON "post_topics"("topicId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_relatedCourseId_fkey" FOREIGN KEY ("relatedCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_topics" ADD CONSTRAINT "post_topics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_topics" ADD CONSTRAINT "post_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
