-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "lastItemId" UUID;

-- AlterTable
ALTER TABLE "item_progress" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "watchedBuckets" BYTEA;

-- CreateIndex
CREATE INDEX "enrollments_lastItemId_idx" ON "enrollments"("lastItemId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_lastItemId_fkey" FOREIGN KEY ("lastItemId") REFERENCES "curriculum_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

