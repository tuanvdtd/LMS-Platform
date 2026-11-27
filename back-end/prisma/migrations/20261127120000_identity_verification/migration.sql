-- Xác minh danh tính giảng viên qua Didit: chỉ lưu kết quả và họ tên trên giấy tờ, không lưu ảnh.
CREATE TYPE "IdentityStatus" AS ENUM ('pending', 'in_review', 'approved', 'declined');

ALTER TABLE "instructor_applications"
  ADD COLUMN "identitySessionId" TEXT,
  ADD COLUMN "identityStatus" "IdentityStatus",
  ADD COLUMN "identityName" TEXT,
  ADD COLUMN "identityCheckedAt" TIMESTAMP(3);

CREATE INDEX "instructor_applications_identitySessionId_idx" ON "instructor_applications"("identitySessionId");
