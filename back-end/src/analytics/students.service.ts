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
import { groupBy } from './helpers.js';
import { assessRisk } from './risk.js';

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
    const { summary, students } = await this.rows(course.id);
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
    const student = isGuid(userId) ? (await this.rows(course.id)).students.find((s) => s.userId === userId) : undefined;
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

  private async rows(courseId: string) {
    const now = new Date();
    const [enrollments, quizRows, passedRows, exercisesTotal, nudgeRows] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        select: {
          userId: true,
          createdAt: true,
          progressPct: true,
          lastAccessedAt: true,
          completedAt: true,
          lastItem: { select: { id: true, title: true } },
          user: { select: { name: true, image: true } },
        },
      }),
      // Lượt nộp sớm nhất của mỗi (học viên, quiz).
      this.prisma.$queryRaw<{ userId: string; scorePct: number; passScorePct: number }[]>`
        SELECT DISTINCT ON (a."userId", a."quizId") a."userId", a."scorePct"::float8 AS "scorePct", a."passScorePct"
        FROM quiz_attempts a JOIN quizzes q ON q.id = a."quizId"
        WHERE q."courseId" = ${courseId}::uuid AND a.status = 'submitted'
        ORDER BY a."userId", a."quizId", a."attemptNo"`,
      this.prisma.$queryRaw<{ userId: string; passed: number }[]>`
        SELECT s."userId", COUNT(DISTINCT s."exerciseId")::int AS passed
        FROM submissions s JOIN exercises e ON e.id = s."exerciseId"
        WHERE e."courseId" = ${courseId}::uuid AND s.status = 'accepted'
        GROUP BY s."userId"`,
      this.prisma.exercise.count({ where: { courseId, item: { isPublished: true } } }),
      this.prisma.$queryRaw<{ userId: string; kind: 'reminder' | 'encourage'; createdAt: Date }[]>`
        SELECT DISTINCT ON ("userId") "userId", kind::text AS kind, "createdAt"
        FROM course_nudges WHERE "courseId" = ${courseId}::uuid
        ORDER BY "userId", "createdAt" DESC`,
    ]);
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
        active7d: enrollments.filter((e) => e.lastAccessedAt && now.getTime() - e.lastAccessedAt.getTime() < 7 * DAY).length,
        completed: count('done'),
        high: count('high'),
        watch: count('watch'),
      },
      students,
    };
  }
}
