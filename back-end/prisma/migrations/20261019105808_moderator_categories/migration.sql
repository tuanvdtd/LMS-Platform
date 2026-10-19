-- CreateTable
CREATE TABLE "moderator_categories" (
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "moderator_categories_pkey" PRIMARY KEY ("userId","categoryId")
);

-- CreateIndex
CREATE INDEX "moderator_categories_categoryId_idx" ON "moderator_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "moderator_categories" ADD CONSTRAINT "moderator_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_categories" ADD CONSTRAINT "moderator_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

