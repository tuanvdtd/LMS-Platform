import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import { activeCounts, activeWeekly } from './activity.js';
import { isVideo, publishedItems, type PublishedItem } from './course-items.js';
import { itemCompletion, PROGRESS } from './course-progress.js';
import { groupBy, r3 } from './helpers.js';
import { computeRetention, RETENTION, watchedSeconds, type RetentionResult, type WatchSegment } from './video-retention.js';
import { vnWeekStart, vnWeeks, vnWindow } from './vn-time.js';

export const lectureNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'LECTURE_NOT_FOUND', message: 'Không tìm thấy bài giảng video' });

type SegRow = { learnerId: string; itemId: string; viewId: string; s: number; e: number; at: Date; seq: number };
const toSeg = (r: SegRow, learnerId = r.learnerId): WatchSegment => ({ learnerId, viewId: r.viewId, s: r.s, e: r.e, at: r.at.getTime(), seq: r.seq });
const r3n = (x: number | null) => (x === null ? null : r3(x));

function retentionDto(item: PublishedItem, r: RetentionResult, enrolled: number) {
  return {
    itemId: item.id, title: item.title, label: item.label, durationSec: item.durationSec, bucketSec: r.bucketSec, n: r.n, enrolled,
    minViewers: RETENTION.minViewers,
    points: r.points.map((p) => ({ t: p.t, retention: r3(p.retention)!, stay: r3(p.stay)!, rewatch: r3(p.rewatch)! })),
    peaks: r.peaks.map((p) => ({ ...p, rewatch: r3(p.rewatch)!, multiple: p.multiple === null ? null : Math.round(p.multiple * 10) / 10 })),
    drop: r.drop && { ...r.drop, lost: r3(r.drop.lost)! },
    finished: r3n(r.finished), avgWatched: r3n(r.avgWatched),
  };
}

// Hành vi học của một khoá. Tính khi đọc.
// ponytail: đọc toàn bộ đoạn video của khoá mỗi lần mở trang; khoá cỡ trăm nghìn đoạn thì gom sẵn theo ngày / bài hoặc cache Redis theo courseId.
@Injectable()
export class EngagementAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: AnalyticsCoursesService,
  ) {}

  private segments(where: Prisma.Sql) {
    return this.prisma.$queryRaw<SegRow[]>`
      SELECT s."enrollmentId" AS "learnerId", s."itemId", s."viewId", s."startSec" AS s, s."endSec" AS e, s."createdAt" AS at, s.seq
      FROM video_watch_segments s JOIN enrollments e ON e.id = s."enrollmentId" JOIN courses c ON c.id = e."courseId"
      WHERE ${where} AND e."userId" <> c."instructorId"`;
  }

  private enrolledCount(courseId: string) {
    return this.prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM enrollments e JOIN courses c ON c.id = e."courseId"
      WHERE e."courseId" = ${courseId}::uuid AND e."userId" <> c."instructorId"`.then((r) => r[0].n);
  }

  async engagement(courseId: string, instructorId: string) {
    const course = await this.courses.owned(courseId, instructorId);
    const now = new Date();
    const w7 = vnWindow(7, now);
    const w30 = vnWindow(30, now);
    const weeks = vnWeeks(now, 12);
    const weeksFrom = new Date(Date.parse(`${weeks[0]}T00:00:00Z`) - 7 * 3_600_000);
    const [items, enrollments, completions, segRows, active, weekly] = await Promise.all([
      publishedItems(this.prisma, course.id),
      this.prisma.$queryRaw<{ id: string; createdAt: Date; completedAt: Date | null }[]>`
        SELECT e.id, e."createdAt", e."completedAt" FROM enrollments e JOIN courses c ON c.id = e."courseId"
        WHERE e."courseId" = ${course.id}::uuid AND e."userId" <> c."instructorId"`,
      this.prisma.$queryRaw<{ enrollmentId: string; itemId: string }[]>`
        SELECT p."enrollmentId", p."itemId" FROM item_progress p
        JOIN enrollments e ON e.id = p."enrollmentId" JOIN courses c ON c.id = e."courseId"
        WHERE e."courseId" = ${course.id}::uuid AND e."userId" <> c."instructorId" AND p."completedAt" IS NOT NULL`,
      this.segments(Prisma.sql`e."courseId" = ${course.id}::uuid`),
      activeCounts(this.prisma, [course.id], w7),
      activeWeekly(this.prisma, [course.id], weeksFrom),
    ]);
    const enrolled = enrollments.length;

    // Phút video đã xem: tính theo từng (ghi danh, bài) để không nối nhầm đoạn của hai bài khác nhau.
    const watchMin = (from: Date, to: Date) =>
      Math.round(watchedSeconds(segRows.filter((r) => r.at >= from && r.at < to).map((r) => toSeg(r, `${r.learnerId}|${r.itemId}`))) / 60);

    const done = groupBy(completions, (c) => c.enrollmentId);
    const completion = itemCompletion(
      items,
      enrollments.map((e) => ({ enrolledAt: e.createdAt.getTime(), completed: new Set((done.get(e.id) ?? []).map((c) => c.itemId)) })),
      now.getTime(),
    );
    const byItem = groupBy(segRows, (r) => r.itemId);
    const videos = items.filter(isVideo);
    const results = videos.map((it) => ({ item: it, r: computeRetention(it.durationSec, (byItem.get(it.id) ?? []).map((x) => toSeg(x))) }));
    const best = results.reduce<(typeof results)[number] | null>((acc, x) => (!acc || x.r.peaks.length > acc.r.peaks.length ? x : acc), null);
    const newByWeek = groupBy(enrollments, (e) => vnWeekStart(e.createdAt));

    return {
      enrolled,
      kpis: {
        active7d: active.total,
        active7dPrev: active.totalPrev,
        watchMin30d: watchMin(w30.from, now),
        watchMin30dPrev: watchMin(w30.prevFrom, w30.from),
        completed: enrollments.filter((e) => e.completedAt).length,
      },
      weekly: weeks.map((weekStart, i) => ({
        weekStart, active: weekly.get(weekStart) ?? 0, newEnrollments: newByWeek.get(weekStart)?.length ?? 0, current: i === weeks.length - 1,
      })),
      progress: {
        n: completion.n, minLearners: PROGRESS.minLearners, minAgeDays: PROGRESS.minAgeDays,
        items: items.map((it, i) => ({ itemId: it.id, type: it.type, title: it.title, label: it.label, completed: r3n(completion.rows[i].completed) })),
        bottleneck: completion.bottleneck && { ...completion.bottleneck, completed: r3(completion.bottleneck.completed)!, drop: r3(completion.bottleneck.drop)! },
      },
      lectures: results.map(({ item, r }) => ({
        itemId: item.id, title: item.title, label: item.label, durationSec: item.durationSec,
        viewers: r.n, started: enrolled ? r3(r.n / enrolled) : null,
        finished: r3n(r.finished), avgWatched: r3n(r.avgWatched), peaks: r.peaks.length, drop: r.drop && { ...r.drop, lost: r3(r.drop.lost)! },
      })),
      defaultLecture: best ? retentionDto(best.item, best.r, enrolled) : null,
    };
  }

  async retention(itemId: string, instructorId: string) {
    if (!isGuid(itemId)) throw lectureNotFound();
    const owned = await this.prisma.curriculumItem.findFirst({
      where: { id: itemId, isPublished: true, type: 'lecture', lectureKind: 'video', course: { instructorId } },
      select: { courseId: true },
    });
    if (!owned) throw lectureNotFound();
    const [items, segRows, enrolled] = await Promise.all([
      publishedItems(this.prisma, owned.courseId),
      this.segments(Prisma.sql`s."itemId" = ${itemId}::uuid`),
      this.enrolledCount(owned.courseId),
    ]);
    const item = items.find((x) => x.id === itemId)!;
    return retentionDto(item, computeRetention(item.durationSec, segRows.map((x) => toSeg(x))), enrolled);
  }
}
