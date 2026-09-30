-- ============================================================================
--  Bổ sung cho migration taxonomy_topics (spec 2026-09-29-udemy-taxonomy-topics §3.3).
--  Prisma DROP các bảng skill cũ nên constraint/index tạo ở 01_post_migrate.sql
--  mất theo, phải tạo lại trên bảng topic mới.
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
--  CẢNH BÁO drift: `prisma migrate dev` không biết các object viết tay sau và sẽ
--  sinh DROP INDEX / ALTER ... DROP DEFAULT rồi áp dụng luôn: idx_courses_search,
--  idx_courses_title_trgm, idx_courses_embedding, cột generated courses."searchTsv",
--  idx_topics_name_trgm, uq_course_primary_topic. Luôn chạy
--  `pnpm prisma migrate dev --create-only --name <x>`, xoá mọi câu lệnh động tới các
--  object trên, rồi mới `pnpm prisma migrate dev`.
-- ============================================================================

ALTER TABLE user_topic_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

-- Bảng m-n ẩn của Prisma cho relation "TopicPrereq", 2 cột "A", "B".
ALTER TABLE "_TopicPrereq"
  ADD CONSTRAINT chk_topic_not_self_prereq CHECK ("A" <> "B");

-- Ô "Tìm kiếm topic" ở bước 3 onboarding: autocomplete trên toàn catalog.
CREATE INDEX idx_topics_name_trgm ON topics USING gin (name gin_trgm_ops);

-- Mỗi khoá tối đa 1 topic chính. "Đúng 1 khi publish" kiểm ở service publish.
CREATE UNIQUE INDEX uq_course_primary_topic ON course_topics ("courseId") WHERE "isPrimary";
