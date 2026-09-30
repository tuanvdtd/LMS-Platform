-- CreateTable
CREATE TABLE "category_topics" (
    "categoryId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_topics_pkey" PRIMARY KEY ("categoryId","topicId")
);

-- CreateIndex
CREATE INDEX "category_topics_categoryId_position_idx" ON "category_topics"("categoryId", "position");

-- AddForeignKey
ALTER TABLE "category_topics" ADD CONSTRAINT "category_topics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_topics" ADD CONSTRAINT "category_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
