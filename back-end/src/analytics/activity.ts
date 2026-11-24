import { Prisma } from '@prisma/client';
import type { PrismaService } from '../infra/prisma.service.js';

// "Học viên hoạt động" — một định nghĩa cho mọi trang (Tổng quan, Hành vi học, Học viên): người học (không phải chủ khoá) có
// ít nhất một đoạn video, mở / hoàn thành bài, lượt quiz hoặc bài nộp trong khoảng. Người chỉ đọc bài PDF mà không tick hoàn thành
// thì không có dữ liệu lịch sử → không được tính.
const events = (courseIds: string[], from: Date) => Prisma.sql`
  SELECT e."userId", e."courseId", s."createdAt" AS at
    FROM video_watch_segments s JOIN enrollments e ON e.id = s."enrollmentId"
    WHERE e."courseId" = ANY(${courseIds}::uuid[]) AND s."createdAt" >= ${from}
  UNION ALL SELECT e."userId", e."courseId", p."createdAt"
    FROM item_progress p JOIN enrollments e ON e.id = p."enrollmentId"
    WHERE e."courseId" = ANY(${courseIds}::uuid[]) AND p."createdAt" >= ${from}
  UNION ALL SELECT e."userId", e."courseId", p."completedAt"
    FROM item_progress p JOIN enrollments e ON e.id = p."enrollmentId"
    WHERE e."courseId" = ANY(${courseIds}::uuid[]) AND p."completedAt" >= ${from}
  UNION ALL SELECT a."userId", q."courseId", a."startedAt"
    FROM quiz_attempts a JOIN quizzes q ON q.id = a."quizId"
    WHERE q."courseId" = ANY(${courseIds}::uuid[]) AND a."startedAt" >= ${from}
  UNION ALL SELECT s."userId", x."courseId", s."submittedAt"
    FROM submissions s JOIN exercises x ON x.id = s."exerciseId"
    WHERE x."courseId" = ANY(${courseIds}::uuid[]) AND s."submittedAt" >= ${from}`;

// Kỳ này [from, now) và kỳ trước [prevFrom, from), theo từng khoá + tổng số người khác nhau trên mọi khoá (một câu SQL).
export async function activeCounts(prisma: PrismaService, courseIds: string[], w: { from: Date; prevFrom: Date }) {
  const byCourse = new Map<string, { cur: number; prev: number }>();
  if (!courseIds.length) return { byCourse, total: 0, totalPrev: 0 };
  const rows = await prisma.$queryRaw<{ courseId: string | null; cur: number; prev: number }[]>`
    WITH ev AS (${events(courseIds, w.prevFrom)})
    SELECT ev."courseId",
           (COUNT(DISTINCT ev."userId") FILTER (WHERE ev.at >= ${w.from}))::int AS cur,
           (COUNT(DISTINCT ev."userId") FILTER (WHERE ev.at < ${w.from}))::int AS prev
    FROM ev JOIN courses c ON c.id = ev."courseId"
    WHERE ev."userId" <> c."instructorId"
    GROUP BY GROUPING SETS ((ev."courseId"), ())`;
  let total = 0;
  let totalPrev = 0;
  for (const r of rows) {
    if (r.courseId) byCourse.set(r.courseId, { cur: r.cur, prev: r.prev });
    else {
      total = r.cur;
      totalPrev = r.prev;
    }
  }
  return { byCourse, total, totalPrev };
}

// Số người hoạt động mỗi tuần (thứ Hai, giờ VN) từ `from`.
export async function activeWeekly(prisma: PrismaService, courseIds: string[], from: Date) {
  const out = new Map<string, number>();
  if (!courseIds.length) return out;
  const rows = await prisma.$queryRaw<{ week: string; n: number }[]>`
    WITH ev AS (${events(courseIds, from)})
    SELECT to_char(date_trunc('week', ev.at + interval '7 hours'), 'YYYY-MM-DD') AS week, COUNT(DISTINCT ev."userId")::int AS n
    FROM ev JOIN courses c ON c.id = ev."courseId"
    WHERE ev."userId" <> c."instructorId"
    GROUP BY 1`;
  for (const r of rows) out.set(r.week, r.n);
  return out;
}
