import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { MessagesService } from '../messages/messages.service.js';
import { activeCounts } from './activity.js';
import { revenueSeries, sellState } from './sales.service.js';
import { StudentsAnalyticsService } from './students.service.js';
import { vnMonthToDate, vnWindow } from './vn-time.js';

const DAY = 86_400_000;
const AT_RISK_LIMIT = 5;
const LOW_REVIEW_LIMIT = 5;

// Trang Tổng quan: mọi khoá của giảng viên, truy vấn chạy song song, số truy vấn không tăng theo số khoá.
@Injectable()
export class OverviewAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly students: StudentsAnalyticsService,
    private readonly messages: MessagesService,
  ) {}

  async overview(me: { id: string; name: string }) {
    const now = new Date();
    const w30 = vnWindow(30, now);
    const mtd = vnMonthToDate(now);
    const courses = await this.prisma.course.findMany({
      where: { instructorId: me.id },
      select: {
        id: true, title: true, status: true,
        approvals: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
      },
    });
    const ids = courses.map((c) => c.id);
    const [k, revenue12m, active, dist, low, unread, risk, sell] = await Promise.all([
      this.prisma.$queryRaw<{
        earnedMonth: number; earnedPrevMonth: number; enrollments30d: number; enrollmentsPrev30d: number;
        rating: number | null; reviewCount: number; unanswered: number; oldestQuestion: Date | null; lowReviews: number;
      }[]>`
        SELECT
          (SELECT COALESCE(SUM(i."instructorEarnAmount"), 0)::float8 FROM order_items i JOIN orders o ON o.id = i."orderId"
             WHERE i."instructorId" = ${me.id}::uuid AND i."refundedAt" IS NULL AND o.status = 'paid'
               AND o."paidAt" >= ${mtd.monthStart}) AS "earnedMonth",
          (SELECT COALESCE(SUM(i."instructorEarnAmount"), 0)::float8 FROM order_items i JOIN orders o ON o.id = i."orderId"
             WHERE i."instructorId" = ${me.id}::uuid AND i."refundedAt" IS NULL AND o.status = 'paid'
               AND o."paidAt" >= ${mtd.prevStart} AND o."paidAt" < ${mtd.prevEnd}) AS "earnedPrevMonth",
          (SELECT COUNT(*)::int FROM enrollments e JOIN courses c ON c.id = e."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND e."userId" <> c."instructorId" AND e."createdAt" >= ${w30.from}) AS "enrollments30d",
          (SELECT COUNT(*)::int FROM enrollments e JOIN courses c ON c.id = e."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND e."userId" <> c."instructorId"
               AND e."createdAt" >= ${w30.prevFrom} AND e."createdAt" < ${w30.from}) AS "enrollmentsPrev30d",
          (SELECT AVG(r.rating)::float8 FROM course_reviews r JOIN courses c ON c.id = r."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND r."userId" <> c."instructorId") AS rating,
          (SELECT COUNT(*)::int FROM course_reviews r JOIN courses c ON c.id = r."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND r."userId" <> c."instructorId") AS "reviewCount",
          (SELECT COUNT(*)::int FROM course_questions q JOIN courses c ON c.id = q."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND q."instructorAnsweredAt" IS NULL AND q."userId" <> c."instructorId") AS unanswered,
          (SELECT MIN(q."createdAt") FROM course_questions q JOIN courses c ON c.id = q."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND q."instructorAnsweredAt" IS NULL AND q."userId" <> c."instructorId") AS "oldestQuestion",
          (SELECT COUNT(*)::int FROM course_reviews r JOIN courses c ON c.id = r."courseId"
             WHERE c."instructorId" = ${me.id}::uuid AND r."userId" <> c."instructorId" AND r.rating <= 2 AND r."createdAt" >= ${w30.from}) AS "lowReviews"`,
      revenueSeries(this.prisma, me.id, '12m', now),
      activeCounts(this.prisma, ids, vnWindow(7, now)),
      this.prisma.$queryRaw<{ rating: number; n: number }[]>`
        SELECT r.rating, COUNT(*)::int AS n FROM course_reviews r JOIN courses c ON c.id = r."courseId"
        WHERE c."instructorId" = ${me.id}::uuid AND r."userId" <> c."instructorId" GROUP BY r.rating`,
      this.prisma.$queryRaw<{
        courseId: string; courseTitle: string; userId: string; userName: string; userImage: string | null;
        rating: number; comment: string | null; createdAt: Date; canMessage: boolean;
      }[]>`
        SELECT r."courseId", c.title AS "courseTitle", r."userId", u.name AS "userName", u.image AS "userImage", r.rating, r.comment,
               r."createdAt", (e."orderId" IS NOT NULL) AS "canMessage"
        FROM course_reviews r JOIN courses c ON c.id = r."courseId" JOIN "user" u ON u.id = r."userId"
        LEFT JOIN enrollments e ON e."courseId" = r."courseId" AND e."userId" = r."userId"
        WHERE c."instructorId" = ${me.id}::uuid AND r."userId" <> c."instructorId" AND r.rating <= 2
        ORDER BY r."createdAt" DESC LIMIT ${LOW_REVIEW_LIMIT}`,
      this.messages.unreadCount(me.id),
      this.students.rowsMany(courses.map((c) => ({ id: c.id, instructorId: me.id }))),
      sellState(this.prisma, me.id),
    ]);
    const kp = k[0];

    const title = new Map(courses.map((c) => [c.id, c.title]));
    const highByCourse = [...risk].map(([courseId, v]) => ({ courseId, high: v.students.filter((s) => s.risk.level === 'high') }));
    const allHigh = highByCourse.flatMap((x) => x.high.map((s) => ({ ...s, courseId: x.courseId })));
    const top = [...highByCourse].sort((a, b) => b.high.length - a.high.length)[0];
    const rejected = courses.filter((c) => c.status === 'draft' && c.approvals[0]?.status === 'rejected');

    return {
      name: me.name,
      verified: sell.verified,
      canSell: sell.canSell,
      kpis: {
        earnedMonth: Math.round(kp.earnedMonth), earnedPrevMonth: Math.round(kp.earnedPrevMonth),
        enrollments30d: kp.enrollments30d, enrollmentsPrev30d: kp.enrollmentsPrev30d,
        active7d: active.total, active7dPrev: active.totalPrev,
        rating: kp.rating === null ? null : Math.round(kp.rating * 10) / 10, reviewCount: kp.reviewCount,
      },
      todo: {
        rejectedCourses: { count: rejected.length, firstTitle: rejected[0]?.title ?? null },
        unansweredQuestions: {
          count: kp.unanswered,
          oldestDays: kp.oldestQuestion ? Math.floor((now.getTime() - kp.oldestQuestion.getTime()) / DAY) : null,
        },
        highRisk: { count: allHigh.length, topCourseId: top && top.high.length ? top.courseId : null },
        lowReviews: kp.lowReviews,
        unreadMessages: unread.count,
      },
      revenue12m,
      atRisk: allHigh
        .sort((a, b) => b.risk.inactiveDays - a.risk.inactiveDays)
        .slice(0, AT_RISK_LIMIT)
        .map((s) => ({
          userId: s.userId, name: s.name, image: s.image, courseId: s.courseId, courseTitle: title.get(s.courseId)!,
          canMessage: s.canMessage, inactiveDays: s.risk.inactiveDays, progressPct: s.progressPct, reasons: s.risk.reasons,
        })),
      reviews: {
        distribution: ([5, 4, 3, 2, 1] as const).map((stars) => ({ stars, count: dist.find((d) => d.rating === stars)?.n ?? 0 })),
        low: low.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      },
    };
  }
}
