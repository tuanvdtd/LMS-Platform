-- Một bộ chức danh / giới thiệu / liên kết cho mỗi tài khoản: chuyển từ instructor_profiles sang user_profiles.
-- instructor_profiles từ nay chỉ dùng cho "đã xác minh" + tài khoản nhận tiền.

ALTER TABLE "user_profiles" ADD COLUMN "website" TEXT,
ADD COLUMN "socials" JSONB NOT NULL DEFAULT '{}';

-- Bản của giảng viên là bản đang hiện công khai nên được giữ khi cả hai bảng cùng có.
INSERT INTO "user_profiles" ("userId", "headline", "bio", "website", "socials", "updatedAt")
SELECT "userId", "headline", "bio", "website", "socials", CURRENT_TIMESTAMP FROM "instructor_profiles"
ON CONFLICT ("userId") DO UPDATE SET
  "headline" = EXCLUDED."headline",
  "bio" = EXCLUDED."bio",
  "website" = EXCLUDED."website",
  "socials" = EXCLUDED."socials",
  "updatedAt" = CURRENT_TIMESTAMP;

-- CHƯA xoá 4 cột cũ ở instructor_profiles (headline, bio, website, socials): database này dùng chung với bản
-- đang chạy trên EC2, code cũ còn đọc các cột đó. Code mới không đọc, không ghi chúng nữa.
-- Khi bản này đã lên prod: thêm migration DROP 4 cột đó.
