-- Bảng chưa từng được ghi → đổi cột / enum trực tiếp, không chuyển dữ liệu. Có dữ liệu thì dừng hẳn.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "instructor_applications") THEN
    RAISE EXCEPTION 'instructor_applications có dữ liệu, cần migration chuyển dữ liệu riêng';
  END IF;
END $$;

-- Tạo lại enum thay cho ADD VALUE: giá trị thêm bằng ADD VALUE không dùng làm DEFAULT được trong cùng transaction.
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');
ALTER TABLE "instructor_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "instructor_applications"
  ALTER COLUMN "status" TYPE "ApplicationStatus" USING ("status"::text::"ApplicationStatus");
ALTER TABLE "instructor_applications" ALTER COLUMN "status" SET DEFAULT 'draft';
DROP TYPE "ApplicationStatus_old";

-- DropIndex
DROP INDEX "instructor_applications_userId_idx";
DROP INDEX "instructor_applications_status_createdAt_idx";

-- AlterTable
ALTER TABLE "instructor_applications" DROP COLUMN "documents",
DROP COLUMN "experience",
ADD COLUMN "headline" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "socials" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "bankBin" TEXT,
ADD COLUMN "bankAccountNo" TEXT,
ADD COLUMN "bankAccountName" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_applications_userId_key" ON "instructor_applications"("userId");
CREATE INDEX "instructor_applications_status_submittedAt_idx" ON "instructor_applications"("status", "submittedAt");


-- ============================================================================
--  Bổ sung cho migration instructor_application_steps (prisma/sql/10_instructor_application.sql).
-- ============================================================================

ALTER TABLE instructor_applications ADD CONSTRAINT chk_application_bank CHECK (
     ("bankBin" IS NULL AND "bankAccountNo" IS NULL AND "bankAccountName" IS NULL)
  OR ("bankBin" ~ '^[0-9]{6}$' AND "bankAccountNo" ~ '^[0-9]{6,19}$'
      AND "bankAccountName" ~ '^[A-Z ]{2,50}$')
);
