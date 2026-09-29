-- ============================================================================
--  Phần schema Prisma không diễn tả được.
--
--  Cách áp dụng: dán vào cuối file migration do Prisma sinh ra
--    pnpm prisma migrate dev --create-only --name init
--    cat prisma/sql/01_post_migrate.sql >> prisma/migrations/<ts>_init/migration.sql
--    pnpm prisma migrate dev
--
--  LƯU Ý ĐẶT TÊN: tên bảng là snake_case (do @@map), tên cột là camelCase
--  (mặc định của Prisma) → mọi cột phải để trong nháy kép.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Extension
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
--  2. Ràng buộc toàn vẹn (rẻ hơn và chắc hơn validate ở tầng app)
-- ---------------------------------------------------------------------------
ALTER TABLE course_reviews
  ADD CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5);

-- [2026-09-29] Bảng đã đổi thành user_topic_mastery, constraint tạo lại ở 03_taxonomy_topics.sql.
ALTER TABLE user_skill_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

ALTER TABLE quizzes
  ADD CONSTRAINT chk_pass_score CHECK ("passScorePct" BETWEEN 0 AND 100);

ALTER TABLE orders
  ADD CONSTRAINT chk_order_amounts CHECK (
    "subtotalAmount" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0
    AND "totalAmount" = "subtotalAmount" - "discountAmount"
  );

ALTER TABLE order_items
  ADD CONSTRAINT chk_item_split CHECK (
    "unitPriceAmount" = "platformFeeAmount" + "instructorEarnAmount"
  );

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercise_limits CHECK ("timeLimitMs" > 0 AND "memoryLimitKb" > 0);

-- SkillLevel dùng chung cho user và course, nhưng 'all_levels' chỉ có nghĩa với course.
ALTER TABLE "user"
  ADD CONSTRAINT chk_user_level CHECK (level IS NULL OR level <> 'all_levels');

-- Taxonomy chỉ sâu 2 tầng (Category → Subcategory), không cho lồng sâu hơn.
-- Khoá học phải gắn vào node lá.
ALTER TABLE categories
  ADD CONSTRAINT chk_category_not_self CHECK (id <> "parentId");

CREATE OR REPLACE FUNCTION chk_category_depth() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."parentId" IS NOT NULL
     AND (SELECT "parentId" FROM categories WHERE id = NEW."parentId") IS NOT NULL
  THEN
    RAISE EXCEPTION 'Taxonomy chỉ cho phép 2 tầng';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_category_depth
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION chk_category_depth();

-- Đồ thị kỹ năng tiên quyết không được tự trỏ vào chính nó.
-- Prisma sinh bảng m-n ẩn "_SkillPrereq" với 2 cột "A", "B".
-- [2026-09-29] Đã đổi thành "_TopicPrereq", xem 03_taxonomy_topics.sql.
ALTER TABLE "_SkillPrereq"
  ADD CONSTRAINT chk_skill_not_self_prereq CHECK ("A" <> "B");

-- Bài học video phải có asset, bài viết phải có nội dung.
ALTER TABLE lessons
  ADD CONSTRAINT chk_lesson_payload CHECK (
    (type <> 'video'   OR "videoAssetId" IS NOT NULL) AND
    (type <> 'article' OR "articleBody"  IS NOT NULL)
  );

-- ---------------------------------------------------------------------------
--  3. Full-text search tiếng Việt
--  unaccent() không IMMUTABLE nên không dùng trực tiếp trong generated column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Prisma tạo cột tsvector thường; đổi thành GENERATED (không ALTER được, phải drop).
ALTER TABLE courses DROP COLUMN IF EXISTS "searchTsv";
ALTER TABLE courses ADD COLUMN "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(title, ''))),       'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(subtitle, ''))),    'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'C')
  ) STORED;

CREATE INDEX idx_courses_search ON courses USING gin ("searchTsv");
CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops); -- gõ sai chính tả

-- Ô "Tìm kiếm một kỹ năng" ở bước 3 onboarding — autocomplete trên toàn catalog.
-- [2026-09-29] Đã thay bằng idx_topics_name_trgm ở 03_taxonomy_topics.sql.
CREATE INDEX idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
--  4. pgvector — recommendation tầng 4 (§3.4)
--  Chỉ index khoá đã duyệt: index nhỏ hơn, và query luôn lọc status anyway.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'approved';

-- ---------------------------------------------------------------------------
--  5. Partial index cho các hàng đợi — nhỏ, chỉ chứa việc còn tồn
-- ---------------------------------------------------------------------------
CREATE INDEX idx_payment_events_unprocessed ON payment_events ("receivedAt")
  WHERE "processedAt" IS NULL;

CREATE INDEX idx_submissions_inflight ON submissions ("submittedAt")
  WHERE status IN ('pending', 'running');

CREATE INDEX idx_reports_open ON content_reports ("createdAt")
  WHERE status = 'open';

CREATE INDEX idx_certificates_active ON certificates ("serialNo")
  WHERE "revokedAt" IS NULL;

CREATE INDEX idx_quizzes_final ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- Chỉ có 1 quiz cuối khoá cho mỗi khoá học.
CREATE UNIQUE INDEX uq_one_final_quiz_per_course ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- ---------------------------------------------------------------------------
--  6. Materialized view — cron REFRESH hằng đêm (§4.5, §4.6)
--  Dữ liệu nguồn đã nằm sẵn trong bảng nghiệp vụ nên không cần bảng stat riêng.
-- ---------------------------------------------------------------------------

-- Tầng 3: "Học viên mua khoá này cũng mua…"
CREATE MATERIALIZED VIEW mv_course_copurchase AS
SELECT
  a."courseId" AS course_id,
  b."courseId" AS other_course_id,
  COUNT(*)::int AS co_count
FROM enrollments a
JOIN enrollments b
  ON a."userId" = b."userId"
 AND a."courseId" <> b."courseId"
GROUP BY a."courseId", b."courseId"
HAVING COUNT(*) >= 2 -- bỏ nhiễu: 1 người mua chung không nói lên gì
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_copurchase ON mv_course_copurchase (course_id, other_course_id);
CREATE INDEX idx_mv_copurchase_rank ON mv_course_copurchase (course_id, co_count DESC);

-- §3.5b: "Bài học nào nhiều người dừng lại không học tiếp"
CREATE MATERIALIZED VIEW mv_lesson_dropoff AS
SELECT
  l.id                                        AS lesson_id,
  l."courseId"                                AS course_id,
  l.position,
  COUNT(lp.*)::int                            AS started,
  COUNT(lp."completedAt")::int                AS completed,
  ROUND(
    1 - COUNT(lp."completedAt")::numeric / NULLIF(COUNT(lp.*), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(lp."watchedSec"), 0)::int      AS avg_watched_sec
FROM lessons l
LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id
GROUP BY l.id, l."courseId", l.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_lesson_dropoff ON mv_lesson_dropoff (lesson_id);
CREATE INDEX idx_mv_lesson_dropoff_course ON mv_lesson_dropoff (course_id, position);

-- §3.5b: tỉ lệ hoàn thành khoá + học viên đang hoạt động
CREATE MATERIALIZED VIEW mv_course_completion AS
SELECT
  e."courseId"                                                AS course_id,
  COUNT(*)::int                                               AS enrolled,
  COUNT(e."completedAt")::int                                 AS completed,
  ROUND(COUNT(e."completedAt")::numeric / NULLIF(COUNT(*), 0), 3) AS completion_rate,
  AVG(e."progressPct")                                        AS avg_progress_pct,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '7 days')::int  AS active_7d,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '30 days')::int AS active_30d
FROM enrollments e
GROUP BY e."courseId"
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_course_completion ON mv_course_completion (course_id);

-- Cron gọi hàm này mỗi đêm. CONCURRENTLY để dashboard không bị khoá khi refresh
-- (đòi hỏi unique index ở trên, đã có).
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lesson_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

-- Lần đầu phải refresh không CONCURRENTLY vì view đang WITH NO DATA.
REFRESH MATERIALIZED VIEW mv_course_copurchase;
REFRESH MATERIALIZED VIEW mv_lesson_dropoff;
REFRESH MATERIALIZED VIEW mv_course_completion;

-- ---------------------------------------------------------------------------
--  7. Seed taxonomy — phần IT của Udemy, bỏ Hardware và "Other"
--  [2026-09-29] Cây này đã bị thay bằng taxonomy Udemy ở 04_taxonomy_seed.sql.
--  courses."categoryId" NOT NULL nên phải chạy trước khi tạo khoá học đầu tiên.
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, "parentId", slug, name, position) VALUES
  (gen_random_uuid(), NULL, 'lap-trinh',        'Lập trình',         1),
  (gen_random_uuid(), NULL, 'khoa-hoc-du-lieu', 'Khoa học dữ liệu',  2),
  (gen_random_uuid(), NULL, 'cntt-ha-tang',     'CNTT & Hạ tầng',    3);

INSERT INTO categories (id, "parentId", slug, name, position)
SELECT gen_random_uuid(), p.id, s.slug, s.name, s.position
FROM (VALUES
  ('lap-trinh',        'web',              'Phát triển Web',            1),
  ('lap-trinh',        'mobile',           'Phát triển Mobile',         2),
  ('lap-trinh',        'ngon-ngu',         'Ngôn ngữ lập trình',        3),
  ('lap-trinh',        'co-so-du-lieu',    'Cơ sở dữ liệu',             4),
  ('lap-trinh',        'game',             'Lập trình Game',            5),
  ('lap-trinh',        'kiem-thu',         'Kiểm thử phần mềm',         6),
  ('lap-trinh',        'ky-thuat-pm',      'Kỹ thuật phần mềm',         7),
  ('lap-trinh',        'cong-cu',          'Công cụ lập trình',         8),
  ('khoa-hoc-du-lieu', 'data-science',     'Data Science',              1),
  ('khoa-hoc-du-lieu', 'phan-tich-du-lieu','Phân tích dữ liệu',         2),
  ('khoa-hoc-du-lieu', 'ai-ml',            'AI & Machine Learning',     3),
  ('cntt-ha-tang',     'devops-cloud',     'DevOps & Cloud',            1),
  ('cntt-ha-tang',     'mang-bao-mat',     'Mạng & Bảo mật',            2),
  ('cntt-ha-tang',     'he-dieu-hanh',     'Hệ điều hành & Máy chủ',    3),
  ('cntt-ha-tang',     'chung-chi',        'Chứng chỉ CNTT',            4)
) AS s(parent_slug, slug, name, position)
JOIN categories p ON p.slug = s.parent_slug;

