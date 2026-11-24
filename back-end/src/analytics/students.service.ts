import { Injectable } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import { tooManyRequests } from '../common/http.js';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { MailService } from '../mail/mail.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { AnalyticsCoursesService, studentNotFound } from './analytics-courses.service.js';
import { STUDENT_PAGE_SIZE, type NudgeInput, type StudentsQuery } from './analytics.schemas.js';
import { VERDICTS } from './exercise-stats.js';
import { activeCounts } from './activity.js';
import { groupBy } from './helpers.js';
import { assessRisk } from './risk.js';
import { vnWindow } from './vn-time.js';

export const NUDGE_COOLDOWN_DAYS = 7;
const DAY = 86_400_000;
const TIMELINE_LIMIT = 50;
const LEVEL_ORDER = { high: 0, watch: 1, ok: 2, new: 3, done: 4 } as const;

// Tên gọi = từ cuối của họ tên ("Nguyễn Thị Mai" → "Mai"); {ten} trong lời nhắn thay theo từng học viên.
export const givenName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name;
export const personalize = (message: string, name: string) => message.replaceAll('{ten}', givenName(name));

type TimelineEvent =
  | { at: Date; kind: 'enrolled' }
  | { at: Date; kind: 'lecture_completed'; title: string }
  | { at: Date; kind: 'quiz'; title: string; scorePct: number; passed: boolean; attemptNo: number }
  | { at: Date; kind: 'submission'; title: string; status: string; score: number }
  | { at: Date; kind: 'nudge'; nudgeKind: 'reminder' | 'encourage' };

// Học viên của khoá + mức nguy cơ (luật ở risk.ts). Không có email, không có điểm kỹ năng Elo từng người.
// ponytail: trả từng trang nhưng vẫn tính nguy cơ trên cả lớp (cần trung vị bạn cùng lứa) mỗi lần gọi;
// lớp cỡ vài nghìn người thì tính sẵn theo lô / cache Redis theo courseId.
@Injectable()
export class StudentsAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: AnalyticsCoursesService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsGateway,
  ) {}

  async list(courseId: string, instructorId: string, { level, page }: StudentsQuery) {
    const course = await this.courses.owned(courseId, instructorId);
    const { summary, students } = await this.rows(course.id, instructorId);
    const counts = { all: students.length, high: 0, watch: 0, ok: 0, new: 0, done: 0 };
    for (const s of students) counts[s.risk.level]++;
    const filtered = level === 'all' ? students : students.filter((s) => s.risk.level === level);
    const pageCount = Math.max(1, Math.ceil(filtered.length / STUDENT_PAGE_SIZE));
    const current = Math.min(page, pageCount);
    return {
      summary,
      counts,
      page: current,
      pageSize: STUDENT_PAGE_SIZE,
      total: filtered.length,
      students: filtered.slice((current - 1) * STUDENT_PAGE_SIZE, current * STUDENT_PAGE_SIZE),
    };
  }

  async detail(courseId: string, userId: string, instructorId: string) {
    const course = await this.courses.owned(courseId, instructorId);
    // Mức nguy cơ phụ thuộc bạn cùng lứa → tính trên cả lớp rồi lấy đúng người.
    const student = isGuid(userId) ? (await this.rows(course.id, instructorId)).students.find((s) => s.userId === userId) : undefined;
    if (!student) throw studentNotFound();
    const [enrollment, attempts, submissions, nudges] = await Promise.all([
      this.prisma.enrollment.findUniqueOrThrow({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: {
          createdAt: true,
          progress: {
            where: { completedAt: { not: null }, item: { type: 'lecture' } },
            select: { completedAt: true, item: { select: { title: true } } },
          },
        },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId, status: 'submitted', quiz: { courseId: course.id } },
        select: { submittedAt: true, scorePct: true, passed: true, attemptNo: true, quiz: { select: { item: { select: { title: true } } } } },
      }),
      this.prisma.submission.findMany({
        where: { userId, status: { in: [...VERDICTS] }, exercise: { courseId: course.id } },
        select: { submittedAt: true, status: true, score: true, exercise: { select: { item: { select: { title: true } } } } },
      }),
      this.prisma.courseNudge.findMany({ where: { courseId: course.id, userId }, select: { createdAt: true, kind: true } }),
    ]);
    const timeline: TimelineEvent[] = [
      { at: enrollment.createdAt, kind: 'enrolled' as const },
      ...enrollment.progress.map((p) => ({ at: p.completedAt!, kind: 'lecture_completed' as const, title: p.item.title })),
      ...attempts.map((a) => ({
        at: a.submittedAt!,
        kind: 'quiz' as const,
        title: a.quiz.item.title,
        scorePct: Number(a.scorePct ?? 0),
        passed: a.passed ?? false,
        attemptNo: a.attemptNo,
      })),
      ...submissions.map((s) => ({ at: s.submittedAt, kind: 'submission' as const, title: s.exercise.item.title, status: s.status, score: s.score })),
      ...nudges.map((n) => ({ at: n.createdAt, kind: 'nudge' as const, nudgeKind: n.kind })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, TIMELINE_LIMIT);
    return { student, timeline };
  }

  // Nhắc học viên: thông báo trong app + email. Mỗi học viên ≤ 1 lần / 7 ngày / khoá; người đã xong / ngoài khoá bị bỏ qua.
  async nudge(courseId: string, instructor: { id: string; name: string }, { userIds, kind, message }: NudgeInput) {
    if (!(await rateLimit(this.redis, `rl:nudge:${instructor.id}`, 20, 3600))) throw tooManyRequests();
    const course = await this.courses.owned(courseId, instructor.id);
    const since = new Date(Date.now() - NUDGE_COOLDOWN_DAYS * DAY);
    const [enrollments, recent] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId: course.id, userId: { in: userIds } },
        select: { userId: true, completedAt: true, user: { select: { name: true, email: true } } },
      }),
      this.prisma.courseNudge.findMany({
        where: { courseId: course.id, userId: { in: userIds }, createdAt: { gte: since } },
        select: { userId: true },
      }),
    ]);
    const byId = new Map(enrollments.map((e) => [e.userId, e]));
    const recentIds = new Set(recent.map((r) => r.userId));
    const skipped: { userId: string; reason: 'not_enrolled' | 'completed' | 'recent' }[] = [];
    const targets: typeof enrollments = [];
    for (const id of userIds) {
      const e = byId.get(id);
      if (!e) skipped.push({ userId: id, reason: 'not_enrolled' });
      else if (e.completedAt) skipped.push({ userId: id, reason: 'completed' });
      else if (recentIds.has(id)) skipped.push({ userId: id, reason: 'recent' });
      else targets.push(e);
    }
    const link = `/learn/${course.slug}`;
    // ponytail: hai yêu cầu song song có thể cùng qua kiểm 7 ngày (nhắc trùng 1 lần); cần chặn tuyệt đối thì khoá theo (khoá, học viên).
    const sent = await this.prisma.$transaction(async (tx) => {
      const out: { userId: string; email: string; text: string; notification: Notification }[] = [];
      for (const t of targets) {
        const text = personalize(message, t.user.name);
        const nudge = await tx.courseNudge.create({ data: { courseId: course.id, instructorId: instructor.id, userId: t.userId, kind, message: text } });
        const notification = await tx.notification.create({
          data: {
            userId: t.userId,
            type: 'course_nudge',
            title: `${instructor.name} nhắn bạn về khoá ${course.title}`,
            body: text,
            link,
            data: { courseId: course.id, nudgeId: nudge.id },
          },
        });
        out.push({ userId: t.userId, email: t.user.email, text, notification });
      }
      return out;
    }, TX_OPTIONS);
    // Đẩy sau commit (như QaService). sendCourseNudge không bao giờ throw.
    for (const s of sent) {
      this.notifications.push(s.notification);
      void this.mail.sendCourseNudge(s.email, { instructorName: instructor.name, courseTitle: course.title, courseSlug: course.slug, kind, message: s.text });
    }
    return { sent: sent.map((s) => s.userId), skipped };
  }

  // list / detail / nudge đã có instructorId (khoá đã qua owned()) → không thêm truy vấn tuần tự.
  private async rows(courseId: string, instructorId: string) {
    return (await this.rowsMany([{ id: courseId, instructorId }])).get(courseId) ?? { summary: { enrolled: 0, active7d: 0, completed: 0, high: 0, watch: 0 }, students: [] };
  }

  // Dữ liệu nguy cơ cho nhiều khoá (Tổng quan gọi một lần); chủ khoá không tính là học viên.
  async rowsMany(courses: { id: string; instructorId: string }[]) {
    const result = new Map<string, Awaited<ReturnType<StudentsAnalyticsService['rowsOne']>>>();
    if (!courses.length) return result;
    const now = new Date();
    const ids = courses.map((c) => c.id);
    const owner = new Map(courses.map((c) => [c.id, c.instructorId]));
    const [allEnrollments, quizRows, passedRows, exerciseCounts, nudgeRows, active] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId: { in: ids } },
        select: {
          courseId: true,
          userId: true,
          createdAt: true,
          progressPct: true,
          lastAccessedAt: true,
          completedAt: true,
          lastItem: { select: { id: true, title: true } },
          user: { select: { name: true, image: true } },
          orderId: true,
        },
      }),
      // Lượt nộp sớm nhất của mỗi (học viên, quiz).
      this.prisma.$queryRaw<{ courseId: string; userId: string; scorePct: number; passScorePct: number }[]>`
        SELECT DISTINCT ON (a."userId", a."quizId") q."courseId", a."userId", a."scorePct"::float8 AS "scorePct", a."passScorePct"
        FROM quiz_attempts a JOIN quizzes q ON q.id = a."quizId"
        WHERE q."courseId" = ANY(${ids}::uuid[]) AND a.status = 'submitted'
        ORDER BY a."userId", a."quizId", a."attemptNo"`,
      this.prisma.$queryRaw<{ courseId: string; userId: string; passed: number }[]>`
        SELECT e."courseId", s."userId", COUNT(DISTINCT s."exerciseId")::int AS passed
        FROM submissions s JOIN exercises e ON e.id = s."exerciseId"
        WHERE e."courseId" = ANY(${ids}::uuid[]) AND s.status = 'accepted'
        GROUP BY e."courseId", s."userId"`,
      this.prisma.exercise.groupBy({ by: ['courseId'], where: { courseId: { in: ids }, item: { isPublished: true } }, _count: { _all: true } }),
      this.prisma.$queryRaw<{ courseId: string; userId: string; kind: 'reminder' | 'encourage'; createdAt: Date }[]>`
        SELECT DISTINCT ON ("courseId", "userId") "courseId", "userId", kind::text AS kind, "createdAt"
        FROM course_nudges WHERE "courseId" = ANY(${ids}::uuid[])
        ORDER BY "courseId", "userId", "createdAt" DESC`,
      activeCounts(this.prisma, ids, vnWindow(7, now)),
    ]);
    const enrollmentsBy = groupBy(allEnrollments, (e) => e.courseId);
    const quizzesBy = groupBy(quizRows, (q) => q.courseId);
    const passedBy = groupBy(passedRows, (p) => p.courseId);
    const nudgesBy = groupBy(nudgeRows, (n) => n.courseId);
    const exercises = new Map(exerciseCounts.map((c) => [c.courseId, c._count._all]));
    for (const id of ids) {
      const enrollments = (enrollmentsBy.get(id) ?? []).filter((e) => e.userId !== owner.get(id));
      result.set(
        id,
        this.rowsOne(now, enrollments, quizzesBy.get(id) ?? [], passedBy.get(id) ?? [], exercises.get(id) ?? 0, nudgesBy.get(id) ?? [], active.byCourse.get(id)?.cur ?? 0),
      );
    }
    return result;
  }

  private rowsOne(
    now: Date,
    enrollments: {
      userId: string;
      createdAt: Date;
      progressPct: unknown;
      lastAccessedAt: Date | null;
      completedAt: Date | null;
      lastItem: { id: string; title: string } | null;
      user: { name: string; image: string | null };
      orderId: string | null;
    }[],
    quizRows: { userId: string; scorePct: number; passScorePct: number }[],
    passedRows: { userId: string; passed: number }[],
    exercisesTotal: number,
    nudgeRows: { userId: string; kind: 'reminder' | 'encourage'; createdAt: Date }[],
    active7d: number,
  ) {
    const quizzes = groupBy(quizRows, (q) => q.userId);
    const passed = new Map(passedRows.map((p) => [p.userId, p.passed]));
    const nudges = new Map(nudgeRows.map((n) => [n.userId, n]));
    const risks = assessRisk(
      now,
      enrollments.map((e) => ({
        userId: e.userId,
        enrolledAt: e.createdAt,
        progressPct: Number(e.progressPct),
        lastAccessedAt: e.lastAccessedAt,
        completedAt: e.completedAt,
        quizzes: quizzes.get(e.userId) ?? [],
      })),
    );
    const students = enrollments
      .map((e) => {
        const r = risks.get(e.userId)!;
        const nudge = nudges.get(e.userId);
        return {
          userId: e.userId,
          name: e.user.name,
          image: e.user.image,
          canMessage: e.orderId !== null,
          enrolledAt: e.createdAt,
          progressPct: Number(e.progressPct),
          lastActiveAt: e.lastAccessedAt,
          completedAt: e.completedAt,
          lastItem: e.lastItem,
          quiz: { attempted: quizzes.get(e.userId)?.length ?? 0, avgFirstPct: r.avgFirstPct },
          code: { passed: passed.get(e.userId) ?? 0, total: exercisesTotal },
          risk: {
            level: r.level,
            inactiveDays: r.inactiveDays,
            lagPts: r.lagPts,
            peerMedianPct: r.peerMedianPct,
            band: r.band,
            quizGapPts: r.quizGapPts,
            reasons: r.reasons,
          },
          lastNudge: nudge
            ? { at: nudge.createdAt, kind: nudge.kind, returned: !!e.lastAccessedAt && e.lastAccessedAt > nudge.createdAt }
            : null,
        };
      })
      .sort((a, b) => LEVEL_ORDER[a.risk.level] - LEVEL_ORDER[b.risk.level] || b.risk.inactiveDays - a.risk.inactiveDays);
    const count = (l: keyof typeof LEVEL_ORDER) => students.filter((s) => s.risk.level === l).length;
    return {
      summary: {
        enrolled: students.length,
        active7d,
        completed: count('done'),
        high: count('high'),
        watch: count('watch'),
      },
      students,
    };
  }
}
