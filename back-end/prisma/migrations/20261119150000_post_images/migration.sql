-- Theo dõi ảnh bài viết trên R2 để dọn file không còn bài nào dùng. Chỉ thêm mới, không đụng bảng cũ.

-- CreateTable
CREATE TABLE "post_images" (
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orphanedAt" TIMESTAMP(3),

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "post_image_uses" (
    "postId" UUID NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "post_image_uses_pkey" PRIMARY KEY ("postId","key")
);

-- CreateIndex
CREATE INDEX "post_images_orphanedAt_idx" ON "post_images"("orphanedAt");

-- CreateIndex
CREATE INDEX "post_image_uses_key_idx" ON "post_image_uses"("key");

-- AddForeignKey
ALTER TABLE "post_image_uses" ADD CONSTRAINT "post_image_uses_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_image_uses" ADD CONSTRAINT "post_image_uses_key_fkey" FOREIGN KEY ("key") REFERENCES "post_images"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
