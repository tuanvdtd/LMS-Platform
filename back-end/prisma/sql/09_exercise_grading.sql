-- ============================================================================
--  Bổ sung cho migration exercise_grading.
--  Cách áp dụng: dán vào cuối migration.sql do `migrate diff` sinh ra.
--  Thêm partial index uq_submissions_inflight_user vào danh sách Prisma không thấy (README).
-- ============================================================================

-- [2026-10-19] Bài code chấm bằng Piston. DROP COLUMN "allowedLanguageIds" đã kéo theo
-- chk_exercise_languages cũ → tạo lại trên cột mới.
ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (coalesce(cardinality("languages"), 0) >= 1);

-- Mỗi học viên chỉ 1 bài đang chờ chấm.
CREATE UNIQUE INDEX uq_submissions_inflight_user ON submissions ("userId")
  WHERE status IN ('pending', 'running');
