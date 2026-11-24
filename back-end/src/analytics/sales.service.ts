import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import type { FunnelQuery, RevenueQuery } from './analytics.schemas.js';
import { FUNNEL, funnel, type FunnelEvent } from './funnel.js';
import { groupBy, r3 } from './helpers.js';
import { vnDays, vnMonths, vnWindow } from './vn-time.js';

const VN = 7 * 3_600_000;
type Range = RevenueQuery['range'];
export type RevenuePoint = { key: string; earned: number; gross: number; sales: number };

// verified = hồ sơ xác minh có tài khoản nhận tiền (cùng điều kiện đặt giá ở price-guard.ts); canSell = verified + có khoá giá > 0.
// FE chọn câu hướng dẫn theo hai cờ: chưa xác minh → "Xác minh hồ sơ…"; đã xác minh mà chưa có khoá có phí → "Đặt giá cho khoá…".
export async function sellState(prisma: PrismaService, instructorId: string) {
  const [profile, paid] = await Promise.all([
    prisma.instructorProfile.findUnique({ where: { userId: instructorId }, select: { bankBin: true } }),
    prisma.course.count({ where: { instructorId, priceAmount: { gt: 0 } } }),
  ]);
  const verified = !!profile?.bankBin;
  return { verified, canSell: verified && paid > 0 };
}

// Khoảng của biểu đồ doanh thu: 30 ngày (theo ngày) / 12 tháng lịch (theo tháng, gồm tháng này). Bảng so sánh khoá dùng chung `from`
// để tổng trên biểu đồ và tổng các dòng khoá khớp nhau.
export function revenueRange(range: Range, now: Date) {
  if (range === '30d') {
    const from = vnWindow(30, now).from;
    return { keys: vnDays(from, 30), from, fmt: 'YYYY-MM-DD' };
  }
  const keys = vnMonths(now, 12);
  return { keys, from: new Date(Date.parse(`${keys[0]}-01T00:00:00Z`) - VN), fmt: 'YYYY-MM' };
}

// Phần giảng viên nhận theo ngày (30 ngày) / tháng (12 tháng), giờ VN. Cùng điều kiện earnedItems() của revenue.service:
// đơn paid, dòng chưa hoàn tiền.
export async function revenueSeries(prisma: PrismaService, instructorId: string, range: Range, now: Date): Promise<RevenuePoint[]> {
  const { keys, from, fmt } = revenueRange(range, now);
  const rows = await prisma.$queryRaw<{ key: string; earned: number; gross: number; sales: number }[]>`
    SELECT to_char(o."paidAt" + interval '7 hours', ${fmt}) AS key,
           SUM(i."instructorEarnAmount")::float8 AS earned, SUM(i."unitPriceAmount")::float8 AS gross, COUNT(*)::int AS sales
    FROM order_items i JOIN orders o ON o.id = i."orderId"
    WHERE i."instructorId" = ${instructorId}::uuid AND i."refundedAt" IS NULL AND o.status = 'paid' AND o."paidAt" >= ${from}
    GROUP BY 1`;
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return keys.map((key) => {
    const r = byKey.get(key);
    return { key, earned: Math.round(r?.earned ?? 0), gross: Math.round(r?.gross ?? 0), sales: r?.sales ?? 0 };
  });
}

type FunnelData = { events: FunnelEvent[]; checkouts: string[]; enrollments: string[]; links: { visitorId: string; userId: string }[] };

@Injectable()
export class SalesAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: AnalyticsCoursesService,
  ) {}

  // Dữ liệu phễu của nhiều khoá từ `from`: lượt xem / thêm giỏ, người có đơn chứa khoá (mọi trạng thái), người ghi danh (trừ chủ khoá).
  // ponytail: đọc toàn bộ course_events của cửa sổ (tới 365 ngày, mọi khoá) vào bộ nhớ để dựng phễu theo người; khoá cỡ chục nghìn lượt xem thì gom COUNT(DISTINCT) trong SQL hoặc cache.
  private async funnelData(courseIds: string[], from: Date): Promise<Map<string, FunnelData>> {
    if (!courseIds.length) return new Map();
    const [events, checkouts, enrollments, links] = await Promise.all([
      this.prisma.$queryRaw<{ courseId: string; kind: 'page_view' | 'cart_add'; userId: string | null; visitorId: string | null; at: Date }[]>`
        SELECT "courseId", kind::text AS kind, "userId", "visitorId", "createdAt" AS at FROM course_events
        WHERE "courseId" = ANY(${courseIds}::uuid[]) AND "createdAt" >= ${from}`,
      this.prisma.$queryRaw<{ courseId: string; userId: string }[]>`
        SELECT DISTINCT i."courseId", o."userId" FROM order_items i JOIN orders o ON o.id = i."orderId"
        WHERE i."courseId" = ANY(${courseIds}::uuid[]) AND o."createdAt" >= ${from}`,
      this.prisma.$queryRaw<{ courseId: string; userId: string }[]>`
        SELECT e."courseId", e."userId" FROM enrollments e JOIN courses c ON c.id = e."courseId"
        WHERE e."courseId" = ANY(${courseIds}::uuid[]) AND e."createdAt" >= ${from} AND e."userId" <> c."instructorId"`,
      // Mã khách → userId gần nhất, không giới hạn thời gian (người đăng nhập trước cửa sổ vẫn được gộp).
      this.prisma.$queryRaw<{ courseId: string; visitorId: string; userId: string }[]>`
        SELECT DISTINCT ON ("courseId", "visitorId") "courseId", "visitorId", "userId" FROM course_events
        WHERE "courseId" = ANY(${courseIds}::uuid[]) AND "visitorId" IS NOT NULL AND "userId" IS NOT NULL
        ORDER BY "courseId", "visitorId", "createdAt" DESC`,
    ]);
    const lk = groupBy(links, (l) => l.courseId);
    const ev = groupBy(events, (e) => e.courseId);
    const co = groupBy(checkouts, (e) => e.courseId);
    const en = groupBy(enrollments, (e) => e.courseId);
    return new Map(courseIds.map((id) => [id, {
      events: (ev.get(id) ?? []).map((e) => ({ kind: e.kind, userId: e.userId, visitorId: e.visitorId, at: e.at.getTime() })),
      checkouts: (co.get(id) ?? []).map((x) => x.userId),
      enrollments: (en.get(id) ?? []).map((x) => x.userId),
      links: (lk.get(id) ?? []).map((l) => ({ visitorId: l.visitorId, userId: l.userId })),
    }]));
  }

  async revenue(instructorId: string, { range }: RevenueQuery) {
    const now = new Date();
    const { from } = revenueRange(range, now);
    const courses = await this.prisma.course.findMany({ where: { instructorId }, select: { id: true, title: true, priceAmount: true } });
    const ids = courses.map((c) => c.id);
    const [sell, series, perCourse, data] = await Promise.all([
      sellState(this.prisma, instructorId),
      revenueSeries(this.prisma, instructorId, range, now),
      this.prisma.$queryRaw<{ courseId: string; earned: number; sales: number }[]>`
        SELECT i."courseId", SUM(i."instructorEarnAmount")::float8 AS earned, COUNT(*)::int AS sales
        FROM order_items i JOIN orders o ON o.id = i."orderId"
        WHERE i."instructorId" = ${instructorId}::uuid AND i."refundedAt" IS NULL AND o.status = 'paid' AND o."paidAt" >= ${from}
        GROUP BY 1`,
      this.funnelData(ids, from),
    ]);
    const money = new Map(perCourse.map((r) => [r.courseId, r]));
    const rows = courses.map((c) => {
      const d = data.get(c.id)!;
      const f = funnel({ isFree: c.priceAmount === 0, ...d });  // FunnelData có đủ events / checkouts / enrollments / links
      const visitors = f.steps[0].people;
      return {
        courseId: c.id, title: c.title, priceAmount: c.priceAmount,
        earned: Math.round(money.get(c.id)?.earned ?? 0), sales: money.get(c.id)?.sales ?? 0,
        newEnrollments: new Set(d.enrollments).size, visitors,
        conversion: visitors ? r3(f.steps.at(-1)!.people / visitors) : null,
      };
    });
    rows.sort((a, b) => b.earned - a.earned || b.newEnrollments - a.newEnrollments);
    const totals = series.reduce((t, p) => ({ earned: t.earned + p.earned, gross: t.gross + p.gross, sales: t.sales + p.sales }), { earned: 0, gross: 0, sales: 0 });
    return { verified: sell.verified, canSell: sell.canSell, range, series, totals, courses: rows };
  }

  async funnel(courseId: string, instructorId: string, { days }: FunnelQuery) {
    const owned = await this.courses.owned(courseId, instructorId);
    const { from } = vnWindow(days, new Date());
    const [course, data, first] = await Promise.all([
      this.prisma.course.findUniqueOrThrow({ where: { id: owned.id }, select: { priceAmount: true } }),
      this.funnelData([owned.id], from),
      this.prisma.courseEvent.findFirst({ where: { courseId: owned.id }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    ]);
    const isFree = course.priceAmount === 0;
    const f = funnel({ isFree, ...data.get(owned.id)! });
    return {
      courseId: owned.id, isFree, days, minVisitors: FUNNEL.minVisitors, steps: f.steps,
      weakest: f.weakest && { key: f.weakest.key, rate: r3(f.weakest.rate)! },
      trackedSince: first?.createdAt.toISOString() ?? null,
    };
  }
}
