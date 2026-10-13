-- Catalog công khai (spec 2026-10-13-public-catalog D2): tìm khoá không dấu bằng unaccent ILIKE.
-- Bật lại extension đã bỏ ở 20260930090000_drop_pg_fulltext; không thêm cột/index (Elasticsearch để feat sau).
CREATE EXTENSION IF NOT EXISTS unaccent;
