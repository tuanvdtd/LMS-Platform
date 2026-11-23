import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { earnedItems } from '../revenue/revenue.service.js';
import { dailySeries, rangeBounds, type OverviewRange } from './overview-range.js';
import { NON_STAFF } from './user-rules.js';

const TOP = 5;

// Tính thẳng từ dữ liệu gốc mỗi lần mở trang (không cron, không bảng stat_*), như dashboard giảng viên.
@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range: OverviewRange, now = new Date()) {
    const { days, from, prevFrom } = rangeBounds(range, now);
    const [cur, prev, orders, pending, unsettled, approvals, applications, top, users, verifiedInstructors, publishedCourses] =
      await Promise.all([
        this.kpis(from, now),
        // cùng độ dài, tới cùng giờ trong ngày: ngày hiện tại còn dở thì so với đúng phần dở của kỳ trước
        this.kpis(prevFrom, new Date(now.getTime() - days * 86_400_000)),
        // ponytail: kéo mọi đơn của kỳ về gom theo ngày; kỳ 90 ngày vượt ~50k đơn thì chuyển sang GROUP BY trong SQL.
        this.prisma.order.findMany({
          where: { status: 'paid', paidAt: { gte: from, lt: now } },
          select: { paidAt: true, totalAmount: true, items: { where: { refundedAt: null }, select: { platformFeeAmount: true } } },
        }),
        this.prisma.payout.aggregate({ where: { status: 'pending' }, _count: { _all: true }, _sum: { amount: true } }),
        this.prisma.orderItem.aggregate({ where: earnedItems({ payoutId: null }), _sum: { instructorEarnAmount: true } }),
        this.prisma.courseApproval.count({ where: { status: 'pending' } }),
        this.prisma.instructorApplication.count({ where: { status: 'pending' } }),
        this.topCourses(from, now),
        this.prisma.user.count({ where: NON_STAFF }),
        this.prisma.instructorProfile.count(),
        this.prisma.course.count({ where: { status: 'published' } }),
      ]);
    const kpis = Object.fromEntries(
      (Object.keys(cur) as (keyof typeof cur)[]).map((k) => [k, { value: cur[k], prev: prev[k] }]),
    ) as Record<keyof typeof cur, { value: number; prev: number }>;
    return {
      range,
      from: from.toISOString(),
      to: now.toISOString(),
      kpis,
      daily: dailySeries(
        orders.map((o) => ({
          paidAt: o.paidAt!,
          totalAmount: o.totalAmount,
          platformFee: o.items.reduce((s, i) => s + i.platformFeeAmount, 0),
        })),
        from,
        days,
      ),
      payouts: {
        pendingCount: pending._count._all,
        pendingAmount: pending._sum.amount ?? 0,
        unsettledAmount: unsettled._sum.instructorEarnAmount ?? 0,
      },
      queues: { courseApprovals: approvals, instructorApplications: applications, payouts: pending._count._all },
      topCourses: top,
      totals: { users, verifiedInstructors, publishedCourses },
    };
  }

  private async kpis(gte: Date, lt: Date) {
    const paidAt = { gte, lt };
    const [orders, fee, newUsers, newEnrollments, newCourses] = await Promise.all([
      this.prisma.order.aggregate({ where: { status: 'paid', paidAt }, _count: { _all: true }, _sum: { totalAmount: true } }),
      this.prisma.orderItem.aggregate({
        where: { refundedAt: null, order: { status: 'paid', paidAt } },
        _sum: { platformFeeAmount: true },
      }),
      this.prisma.user.count({ where: { AND: [NON_STAFF, { createdAt: { gte, lt } }] } }),
      this.prisma.enrollment.count({ where: { createdAt: { gte, lt } } }),
      this.prisma.course.count({ where: { publishedAt: { gte, lt } } }),
    ]);
    return {
      gmv: orders._sum.totalAmount ?? 0,
      platformFee: fee._sum.platformFeeAmount ?? 0,
      paidOrders: orders._count._all,
      newUsers,
      newEnrollments,
      newCourses,
    };
  }

  private async topCourses(gte: Date, lt: Date) {
    const groups = await this.prisma.orderItem.groupBy({
      by: ['courseId'],
      where: { refundedAt: null, order: { status: 'paid', paidAt: { gte, lt } } },
      _sum: { unitPriceAmount: true },
      _count: { _all: true },
      orderBy: [{ _sum: { unitPriceAmount: 'desc' } }, { courseId: 'asc' }],
      take: TOP,
    });
    const courses = await this.prisma.course.findMany({
      where: { id: { in: groups.map((g) => g.courseId) } },
      select: { id: true, title: true, instructor: { select: { name: true } } },
    });
    const byId = new Map(courses.map((c) => [c.id, c]));
    return groups.map((g) => ({
      id: g.courseId,
      title: byId.get(g.courseId)?.title ?? '',
      instructorName: byId.get(g.courseId)?.instructor.name ?? '',
      orders: g._count._all,
      revenue: g._sum.unitPriceAmount ?? 0,
    }));
  }
}
