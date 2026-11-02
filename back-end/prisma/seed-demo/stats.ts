import type { PrismaClient } from '@prisma/client';

const SEED_USERS = `SELECT id FROM "user" WHERE email LIKE '%@skillpath.test'`;

// Các cột này denormalized nhưng app chưa có chỗ nào ghi: tính lại từ dữ liệu thật của khoá seed.
export async function recomputeStats(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    UPDATE courses c SET
      "ratingAvg"        = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM course_reviews r WHERE r."courseId" = c.id), 0),
      "ratingCount"      = (SELECT COUNT(*) FROM course_reviews r WHERE r."courseId" = c.id),
      "enrollmentCount"  = (SELECT COUNT(*) FROM enrollments e WHERE e."courseId" = c.id),
      "lectureCount"     = (SELECT COUNT(*) FROM curriculum_items i WHERE i."courseId" = c.id AND i.type = 'lecture' AND i."isPublished"),
      "totalDurationSec" = (SELECT COALESCE(SUM("durationSec"), 0) FROM curriculum_items i WHERE i."courseId" = c.id AND i.type = 'lecture' AND i."isPublished")
    WHERE c."instructorId" IN (${SEED_USERS})`);
}

export async function coverageReport(prisma: PrismaClient) {
  const rows = await prisma.$queryRawUnsafe<{ occupation: string; total: number; covered: number; missing: string | null }[]>(`
    SELECT ot.occupation::text AS occupation, COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE x.n > 0)::int AS covered,
           STRING_AGG(t.slug, ', ') FILTER (WHERE x.n = 0) AS missing
    FROM occupation_topics ot
    JOIN topics t ON t.id = ot."topicId"
    CROSS JOIN LATERAL (
      SELECT COUNT(*) AS n FROM course_topics ct JOIN courses c ON c.id = ct."courseId"
      WHERE ct."topicId" = ot."topicId" AND c.status = 'published'
    ) x
    GROUP BY ot.occupation ORDER BY 1`);
  return { rows, ok: rows.every((r) => r.covered === r.total) };
}
