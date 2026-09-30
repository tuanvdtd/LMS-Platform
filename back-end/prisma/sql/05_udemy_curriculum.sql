-- ============================================================================
--  Bổ sung cho migration udemy_curriculum (spec 2026-09-30-udemy-curriculum-schema §5).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
--  ĐẦU migration.sql phải có (thêm tay, trước mọi lệnh Prisma sinh):
--    DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;   -- phụ thuộc bảng lessons
--    DROP INDEX IF EXISTS idx_courses_embedding;           -- WHERE status = 'approved' chặn đổi enum
--
--  CẢNH BÁO drift — danh sách ĐẦY ĐỦ object viết tay mà Prisma không biết (thay danh sách ở 03).
--  Luôn `--create-only`, rồi rà migration.sql:
--  (a) Luôn xuất hiện trong mọi `migrate dev --create-only`/`migrate diff`, phải xoá tay:
--    DROP INDEX uq_sections_position, uq_items_position, uq_questions_position
--    (unique DEFERRABLE, Prisma thấy như index lạ).
--  (b) Prisma không nhìn thấy (partial index, CHECK chk_*, MV mv_*) nên sẽ không sinh lệnh cho chúng
--      — đừng viết SQL động vào chúng:
--    idx_courses_embedding, uq_course_primary_topic, idx_qa_unanswered,
--    idx_quizzes_final, uq_one_final_quiz_per_course, idx_certificates_active,
--    idx_submissions_inflight, idx_reports_open, idx_payment_events_unprocessed (partial index ở init),
--    các CHECK chk_* (Prisma không quản lý CHECK), mv_* (materialized view).
--  (idx_courses_search, idx_courses_title_trgm, searchTsv đã drop ở drop_pg_fulltext;
--   idx_topics_name_trgm do Prisma quản lý.)
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Unique DEFERRABLE — kéo thả đổi chỗ trong một transaction (spec D5)
-- ---------------------------------------------------------------------------
ALTER TABLE sections ADD CONSTRAINT uq_sections_position
  UNIQUE ("courseId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE curriculum_items ADD CONSTRAINT uq_items_position
  UNIQUE ("sectionId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE questions ADD CONSTRAINT uq_questions_position
  UNIQUE ("quizId", position) DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
--  2. CHECK
--  Mọi so sánh trên cột nullable dùng IS [NOT] DISTINCT FROM / coalesce:
--  CHECK trả NULL được coi là ĐẠT, nên "NULL = 'video'" sẽ lọt.
-- ---------------------------------------------------------------------------

-- Lecture: chưa có nội dung (không được xuất bản) | video | document. Loại khác: không có cột lecture.
-- Asset đúng kind (video/document) không kiểm được bằng CHECK (khác bảng) → service đảm bảo.
ALTER TABLE curriculum_items ADD CONSTRAINT chk_item_payload CHECK (
  CASE WHEN type = 'lecture' THEN
       ("lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
        AND NOT "isPublished")
    OR ("lectureKind" IS NOT DISTINCT FROM 'video'
        AND "videoAssetId" IS NOT NULL AND "documentAssetId" IS NULL)
    OR ("lectureKind" IS NOT DISTINCT FROM 'document'
        AND "documentAssetId" IS NOT NULL AND "videoAssetId" IS NULL)
  ELSE "lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
  END
);

ALTER TABLE assets ADD CONSTRAINT chk_asset_pdf
  CHECK (kind <> 'document' OR "mimeType" = 'application/pdf');

-- [2026-09-30] Vá NULL ở migration exercise_languages_not_null.
ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (coalesce(cardinality("allowedLanguageIds"), 0) >= 1);

ALTER TABLE courses ADD CONSTRAINT chk_course_price CHECK ("priceAmount" >= 0);

ALTER TABLE coupons
  ADD CONSTRAINT chk_coupon_code CHECK (code ~ '^[A-Z0-9_-]{6,20}$'),
  ADD CONSTRAINT chk_coupon_price CHECK (
       (type = 'fixed_price' AND coalesce("priceAmount", 0) > 0)
    OR (type = 'free' AND "priceAmount" IS NULL)
  ),
  ADD CONSTRAINT chk_coupon_window CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT chk_coupon_redemptions CHECK (
    "redeemedCount" >= 0
    AND ("maxRedemptions" IS NULL OR ("maxRedemptions" > 0 AND "redeemedCount" <= "maxRedemptions"))
    AND (type <> 'free' OR "maxRedemptions" IS NOT NULL)
  );

ALTER TABLE order_items ADD CONSTRAINT chk_order_item_list_price
  CHECK ("listPriceAmount" >= "unitPriceAmount");

ALTER TABLE notes ADD CONSTRAINT chk_note_position CHECK ("positionSec" >= 0);

-- ---------------------------------------------------------------------------
--  3. Partial index
-- ---------------------------------------------------------------------------
-- Tạo lại (drop ở đầu migration): chỉ index khoá đang bán.
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'published';

-- Dashboard giảng viên: câu hỏi chưa có giảng viên trả lời.
CREATE INDEX idx_qa_unanswered ON course_questions ("courseId", "createdAt")
  WHERE "instructorAnsweredAt" IS NULL;

-- ---------------------------------------------------------------------------
--  4. Materialized view — thay mv_lesson_dropoff (§3.5b: bài nào nhiều người bỏ dở)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_item_dropoff AS
SELECT
  i.id                                        AS item_id,
  i."courseId"                                AS course_id,
  s.position                                  AS section_position,
  i.position,
  COUNT(p."itemId")::int                      AS started,
  COUNT(p."completedAt")::int                 AS completed,
  ROUND(
    1 - COUNT(p."completedAt")::numeric / NULLIF(COUNT(p."itemId"), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(p."watchedSec"), 0)::int       AS avg_watched_sec
FROM curriculum_items i
JOIN sections s ON s.id = i."sectionId"
LEFT JOIN item_progress p ON p."itemId" = i.id
WHERE i.type = 'lecture'
GROUP BY i.id, i."courseId", s.position, i.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_item_dropoff ON mv_item_dropoff (item_id);
CREATE INDEX idx_mv_item_dropoff_course ON mv_item_dropoff (course_id, section_position, position);

-- Giữ tên hàm: job pg_cron (nếu có) không phải sửa.
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_item_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

REFRESH MATERIALIZED VIEW mv_item_dropoff;
