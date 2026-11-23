import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AUTH, type Auth, authCall, isStaff } from '../auth/auth.js';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { earnedItems } from '../revenue/revenue.service.js';
import { USERS_PAGE_SIZE, type LockUserInput, type UsersQuery } from './admin.schemas.js';
import { AuditLogService } from './audit-log.service.js';
import { activeWhere, banSeconds, lockedWhere, lockState, NON_STAFF, rolesOf } from './user-rules.js';

const RECENT = 5;
const BAN = { banned: true, banReason: true, banExpires: true } as const;

const LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  role: true,
  ...BAN,
  instructorProfile: { select: { userId: true } },
  _count: { select: { enrollments: true, courses: true } },
} satisfies Prisma.UserSelect;

const notLocked = () =>
  new ConflictException({ statusCode: 409, code: 'USER_NOT_LOCKED', message: 'Tài khoản đang không bị khoá' });

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly audit: AuditLogService,
    private readonly mail: MailService,
  ) {}

  async list(q: UsersQuery, now = new Date()) {
    const and: Prisma.UserWhereInput[] = [NON_STAFF];
    if (q.q) {
      and.push({
        OR: [
          { name: { contains: q.q, mode: 'insensitive' } },
          { email: { contains: q.q, mode: 'insensitive' } },
        ],
      });
    }
    if (q.role === 'student') and.push({ OR: [{ role: null }, { NOT: { role: { contains: 'instructor' } } }] });
    if (q.role === 'instructor') and.push({ role: { contains: 'instructor' } });
    if (q.role === 'verified') and.push({ instructorProfile: { isNot: null } });
    if (q.status === 'locked') and.push(lockedWhere(now));
    if (q.status === 'active') and.push(activeWhere(now));
    const where: Prisma.UserWhereInput = { AND: and };
    // ponytail: ILIKE '%q%' quét cả bảng user; thêm index pg_trgm khi số người dùng lên hàng trăm nghìn.
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (q.page - 1) * USERS_PAGE_SIZE,
        take: USERS_PAGE_SIZE,
        select: LIST_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);
    const items = rows.map(({ role, banned, banReason, banExpires, instructorProfile, _count, ...u }) => {
      const s = lockState({ banned, banReason, banExpires }, now);
      return {
        ...u,
        roles: rolesOf(role),
        verified: !!instructorProfile,
        status: s.status,
        lockedUntil: s.lockedUntil,
        enrollmentCount: _count.enrollments,
        courseCount: _count.courses,
      };
    });
    return { items, total, page: q.page, pageSize: USERS_PAGE_SIZE };
  }

  async detail(id: string, now = new Date()) {
    const u = await this.target(id);
    const roles = rolesOf(u.role);
    const [enrollmentCount, completedCount, enrollments, paid, orders, teaching, sessions, audit] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId: id } }),
      this.prisma.enrollment.count({ where: { userId: id, completedAt: { not: null } } }),
      this.prisma.enrollment.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: RECENT,
        select: { courseId: true, progressPct: true, createdAt: true, completedAt: true, course: { select: { title: true, slug: true } } },
      }),
      this.prisma.order.aggregate({ where: { userId: id, status: 'paid' }, _count: { _all: true }, _sum: { totalAmount: true } }),
      this.prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: RECENT,
        select: { id: true, status: true, totalAmount: true, createdAt: true, paidAt: true, items: { select: { course: { select: { title: true } } } } },
      }),
      roles.includes('instructor') ? this.teaching(id) : null,
      this.prisma.session.findMany({
        where: { userId: id, expiresAt: { gt: now } },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true },
      }),
      this.audit.forTarget(id),
    ]);
    const s = lockState(u, now);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      roles,
      twoFactorEnabled: !!u.twoFactorEnabled,
      loginMethods: [...new Set(u.accounts.map((a) => a.providerId))],
      verifiedAt: u.instructorProfile?.verifiedAt ?? null,
      ...s,
      learning: {
        enrollmentCount,
        completedCount,
        recent: enrollments.map((e) => ({
          courseId: e.courseId,
          title: e.course.title,
          slug: e.course.slug,
          progressPct: Number(e.progressPct),
          enrolledAt: e.createdAt,
          completedAt: e.completedAt,
        })),
      },
      purchases: {
        paidOrderCount: paid._count._all,
        totalSpent: paid._sum.totalAmount ?? 0,
        recent: orders.map(({ items, ...o }) => ({ ...o, courses: items.map((i) => i.course.title) })),
      },
      teaching,
      sessions,
      audit,
    };
  }

  // Better Auth tự thu hồi mọi phiên (DB + Redis) khi ban.
  async lock(id: string, actorId: string, input: LockUserInput, headers: Headers) {
    const u = await this.target(id);
    const banExpiresIn = banSeconds(input.duration);
    const { user } = await authCall(() =>
      this.auth.api.banUser({ body: { userId: id, banReason: input.reason, banExpiresIn }, headers }),
    );
    const expiresAt = user.banExpires ? new Date(user.banExpires) : null;
    await this.audit.record({
      actorId,
      action: 'user_lock',
      targetId: id,
      data: { reason: input.reason, expiresAt: expiresAt?.toISOString() ?? null },
    });
    await this.mail.sendAccountLocked(u.email, input.reason, expiresAt);
    return this.detail(id);
  }

  async unlock(id: string, actorId: string, headers: Headers) {
    const u = await this.target(id);
    if (lockState(u).status !== 'locked') throw notLocked();
    await authCall(() => this.auth.api.unbanUser({ body: { userId: id }, headers }));
    await this.audit.record({ actorId, action: 'user_unlock', targetId: id });
    return this.detail(id);
  }

  async revokeSessions(id: string, actorId: string, headers: Headers) {
    await this.target(id);
    await authCall(() => this.auth.api.revokeUserSessions({ body: { userId: id }, headers }));
    await this.audit.record({ actorId, action: 'user_revoke_sessions', targetId: id });
    return this.detail(id);
  }

  // id sai dạng / không có / tài khoản staff → 404 (không lộ là staff).
  private async target(id: string) {
    const u = isGuid(id)
      ? await this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            createdAt: true,
            role: true,
            twoFactorEnabled: true,
            ...BAN,
            accounts: { select: { providerId: true } },
            instructorProfile: { select: { verifiedAt: true } },
          },
        })
      : null;
    if (!u || isStaff(u.role)) throw new NotFoundException();
    return u;
  }

  private async teaching(id: string) {
    const [courseCount, publishedCount, earned, recent] = await Promise.all([
      this.prisma.course.count({ where: { instructorId: id } }),
      this.prisma.course.count({ where: { instructorId: id, status: 'published' } }),
      this.prisma.orderItem.aggregate({ where: earnedItems({ instructorId: id }), _sum: { instructorEarnAmount: true } }),
      this.prisma.course.findMany({
        where: { instructorId: id },
        orderBy: { createdAt: 'desc' },
        take: RECENT,
        select: { id: true, title: true, status: true, _count: { select: { enrollments: true } } },
      }),
    ]);
    return {
      courseCount,
      publishedCount,
      totalEarned: earned._sum.instructorEarnAmount ?? 0,
      recent: recent.map(({ _count, ...c }) => ({ ...c, enrollmentCount: _count.enrollments })),
    };
  }
}
