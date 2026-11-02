-- AlterTable
ALTER TABLE "assets" ADD COLUMN "hlsJobId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "assets_hlsJobId_key" ON "assets"("hlsJobId");
