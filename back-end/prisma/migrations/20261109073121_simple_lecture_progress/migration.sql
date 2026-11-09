
DROP MATERIALIZED VIEW mv_item_dropoff;

ALTER TABLE item_progress
  DROP COLUMN "watchedBuckets",
  DROP COLUMN "watchedSec",
  DROP COLUMN "updatedAt";

-- Bài nào nhiều người bỏ dở: số người bắt đầu, số người xong, tỉ lệ bỏ dở.
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
  )                                           AS dropoff_rate
FROM curriculum_items i
JOIN sections s ON s.id = i."sectionId"
LEFT JOIN item_progress p ON p."itemId" = i.id
WHERE i.type = 'lecture'
GROUP BY i.id, i."courseId", s.position, i.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_item_dropoff ON mv_item_dropoff (item_id);
CREATE INDEX idx_mv_item_dropoff_course ON mv_item_dropoff (course_id, section_position, position);

REFRESH MATERIALIZED VIEW mv_item_dropoff;
