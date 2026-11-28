-- Mỗi giấy tờ chỉ xác minh cho một tài khoản (lưu HMAC, không lưu số gốc); thông báo khi đổi tài khoản nhận tiền.
CREATE TYPE "IdentityIssue" AS ENUM ('duplicate_document');

ALTER TYPE "NotificationType" ADD VALUE 'payout_account';

ALTER TABLE "instructor_applications"
  ADD COLUMN "identityDocHash" TEXT,
  ADD COLUMN "identityIssue" "IdentityIssue";

CREATE UNIQUE INDEX "instructor_applications_identityDocHash_key" ON "instructor_applications"("identityDocHash");
