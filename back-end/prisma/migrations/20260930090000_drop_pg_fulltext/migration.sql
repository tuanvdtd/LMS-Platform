-- Tìm kiếm khoá học chuyển sang Elasticsearch: bỏ full-text search của Postgres.
-- Giữ pg_trgm cho idx_topics_name_trgm (autocomplete topic), nay đã khai trong schema.prisma.
DROP INDEX IF EXISTS idx_courses_search;
DROP INDEX IF EXISTS idx_courses_title_trgm;
ALTER TABLE courses DROP COLUMN IF EXISTS "searchTsv";
DROP FUNCTION IF EXISTS immutable_unaccent(text);
DROP EXTENSION IF EXISTS unaccent;
