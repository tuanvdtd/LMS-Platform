import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { LectureKind, Prisma } from '@prisma/client';
import { bucketOf } from '../assets/assets.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { completeItem } from '../curriculum/progress.js';
import { tooManyRequests } from '../exercise/exercise.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { StorageService } from '../infra/storage.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import type { ProgressInput } from './learn.schemas.js';
import { BUCKET_SEC, bucketCount, isWatched, mergeBuckets, popcount, watchBudget } from './watch-bitmap.js';

const MEDIA_TTL = 3600; // hết hạn giữa chừng → FE gọi lại GET bài giảng
const RESOURCE_TTL = 300;

const LECTURE_SELECT = {
  id: true,
  courseId: true,
  title: true,
  description: true,
  lectureKind: true,
  durationSec: true,
  isDownloadable: true,
  videoAsset: { select: { kind: true, storageKey: true, status: true } },
  documentAsset: { select: { kind: true, storageKey: true, status: true, fileName: true } },
  resources: {
    orderBy: { position: 'asc' },
    select: { id: true, title: true, asset: { select: { fileName: true, sizeBytes: true } } },
  },
} satisfies Prisma.CurriculumItemSelect;
export type LectureRow = Prisma.CurriculumItemGetPayload<{ select: typeof LECTURE_SELECT }>;

export const notEnrolled = () =>
  new ForbiddenException({ statusCode: 403, code: 'NOT_ENROLLED', message: 'Bạn chưa ghi danh khoá học này' });
export const courseNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });
export const itemNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'Không tìm thấy bài học' });
const lectureNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'LECTURE_NOT_FOUND', message: 'Không tìm thấy bài giảng' });
const resourceNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy tài liệu' });


// Transaction ~6 query; DB dev ~1-2s/query → 15s của TX_OPTIONS không đủ (như quiz).
const PROGRESS_TX = { ...TX_OPTIONS, timeout: 60_000 };
const notTracked = () =>
  new ConflictException({ statusCode: 409, code: 'PROGRESS_NOT_TRACKED', message: 'Bài này không theo dõi thời lượng xem' });
const autoOnly = () =>
  new ConflictException({ statusCode: 409, code: 'AUTO_COMPLETE_ONLY', message: 'Bài này tự hoàn thành khi xem đủ 90%' });

// PDF, hoặc video không có thời lượng (upload báo 0) → không tính được 90%, đánh dấu tay.
export const isManual = (item: { lectureKind: LectureKind | null; durationSec: number }) =>
  item.lectureKind === 'document' || item.durationSec === 0;

// Học viên học bài giảng. Không @Roles, kiểm ghi danh ở đây.
// Lọc khoá bằng slug (không lọc published) như quiz/code: đã ghi danh thì vẫn học khi khoá bị gỡ.
@Injectable()
export class LearnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly redis: RedisService,
  ) {}

  async outline(slug: string, userId: string) {
    const [course, enrollment] = await Promise.all([
      this.prisma.course.findUnique({ where: { slug }, select: { id: true, slug: true, title: true } }),
      this.findEnrollment(slug, userId, { progressPct: true, completedAt: true, lastItemId: true }),
    ]);
    if (!course) throw courseNotFound();
    if (!enrollment) throw notEnrolled();
    const [sections, done] = await Promise.all([
      this.prisma.section.findMany({
        where: { courseId: course.id },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          items: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            select: { id: true, type: true, title: true, lectureKind: true, durationSec: true },
          },
        },
      }),
      this.prisma.itemProgress.findMany({
        where: { enrollmentId: enrollment.id, completedAt: { not: null } },
        select: { itemId: true },
      }),
    ]);
    const completed = new Set(done.map((p) => p.itemId));
    const visible = sections
      .filter((s) => s.items.length)
      .map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, completed: completed.has(i.id) })) }));
    const items = visible.flatMap((s) => s.items);
    // "Tiếp tục học": bài mở gần nhất → bài đầu chưa xong → bài đầu.
    const resume = items.find((i) => i.id === enrollment.lastItemId) ?? items.find((i) => !i.completed) ?? items[0];
    return {
      course,
      progressPct: Number(enrollment.progressPct),
      completedAt: enrollment.completedAt,
      resumeItemId: resume?.id ?? null,
      sections: visible,
    };
  }

  async setLastItem(slug: string, userId: string, itemId: string) {
    const [item, enrollment] = await Promise.all([
      this.prisma.curriculumItem.findFirst({ where: { id: itemId, isPublished: true, course: { slug } }, select: { id: true } }),
      this.findEnrollment(slug, userId),
    ]);
    if (!item) throw itemNotFound();
    if (!enrollment) throw notEnrolled();
    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastItemId: itemId, lastAccessedAt: new Date() },
    });
  }

  async lecture(slug: string, userId: string, itemId: string) {
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    const asset = item.lectureKind === 'video' ? item.videoAsset : item.documentAsset;
    const doc = item.documentAsset;
    const [progress, mediaUrl, downloadUrl] = await Promise.all([
      this.prisma.itemProgress.findUnique({
        where: { enrollmentId_itemId: { enrollmentId: enrollment.id, itemId } },
        select: { lastPositionSec: true, watchedSec: true, completedAt: true },
      }),
      asset?.status === 'ready' ? this.storage.presignGet(bucketOf(asset.kind), asset.storageKey, MEDIA_TTL) : null,
      item.lectureKind === 'document' && item.isDownloadable && doc?.status === 'ready'
        ? this.storage.presignGet(bucketOf(doc.kind), doc.storageKey, MEDIA_TTL, { fileName: doc.fileName })
        : null,
    ]);
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      lectureKind: item.lectureKind,
      durationSec: item.durationSec,
      mediaUrl,
      downloadUrl,
      manualComplete: isManual(item),
      resources: item.resources.map((r) => ({
        id: r.id,
        title: r.title,
        fileName: r.asset.fileName,
        sizeBytes: Number(r.asset.sizeBytes),
      })),
      progress: {
        lastPositionSec: progress?.lastPositionSec ?? 0,
        watchedSec: progress?.watchedSec ?? 0,
        completed: !!progress?.completedAt,
      },
    };
  }

  async resource(slug: string, userId: string, resourceId: string) {
    if (!isGuid(resourceId)) throw resourceNotFound();
    const [res, enrollment] = await Promise.all([
      this.prisma.lectureResource.findFirst({
        where: { id: resourceId, item: { isPublished: true, course: { slug } } },
        select: { asset: { select: { kind: true, storageKey: true, fileName: true, status: true } } },
      }),
      this.findEnrollment(slug, userId),
    ]);
    if (!res || res.asset.status !== 'ready') throw resourceNotFound();
    if (!enrollment) throw notEnrolled();
    const { kind, storageKey, fileName } = res.asset;
    return { url: await this.storage.presignGet(bucketOf(kind), storageKey, RESOURCE_TTL, { fileName }) };
  }

  // Bài giảng đã xuất bản + có nội dung, trước ghi danh (404 trước 403); 2 query song song (DB xa).
  async loadLecture(slug: string, userId: string, itemId: string) {
    if (!isGuid(itemId)) throw lectureNotFound();
    const [item, enrollment] = await Promise.all([
      this.prisma.curriculumItem.findFirst({
        where: { id: itemId, type: 'lecture', isPublished: true, course: { slug } },
        select: LECTURE_SELECT,
      }),
      this.findEnrollment(slug, userId),
    ]);
    if (!item?.lectureKind) throw lectureNotFound();
    if (!enrollment) throw notEnrolled();
    return { item, enrollment };
  }

  // Heartbeat video. Khoá dòng item_progress: 2 tab cùng xem không ghi đè bitmap của nhau.
  // ponytail: ghi DB mỗi heartbeat (~2 lần/phút/người đang xem); DB nặng → đệm Redis, flush định kỳ.
  // Mất mạng lâu rồi gửi dồn thì phần vượt trần chống gian lận (không xem nhanh hơn thời gian thực) bị bỏ, học viên xem lại đoạn đó.
  async progress(slug: string, userId: string, itemId: string, body: ProgressInput) {
    if (!(await rateLimit(this.redis, `rl:learn-progress:${userId}`, 30, 60))) throw tooManyRequests();
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    if (item.lectureKind !== 'video' || isManual(item)) throw notTracked();
    const total = bucketCount(item.durationSec);
    return this.prisma.$transaction(async (tx) => {
      // INSERT … ON CONFLICT: 2 heartbeat đầu tiên song song không đụng unique như upsert của Prisma.
      await tx.$executeRaw`INSERT INTO item_progress ("enrollmentId", "itemId", "updatedAt")
        VALUES (${enrollment.id}::uuid, ${itemId}::uuid, now()) ON CONFLICT DO NOTHING`;
      // elapsed tính bằng đồng hồ DB (createdAt cũng do DB đặt) → không lệch giờ DB ↔ Node.
      // floor: createdAt là TIMESTAMP(3) làm tròn ms nên elapsed lệch vài µs, làm trần nhảy thêm 1 đoạn.
      const [row] = await tx.$queryRaw<{ watchedBuckets: Uint8Array | null; completedAt: Date | null; elapsed: number }[]>`
        SELECT "watchedBuckets", "completedAt", floor(EXTRACT(EPOCH FROM now() - "createdAt"))::float8 AS elapsed
        FROM item_progress
        WHERE "enrollmentId" = ${enrollment.id}::uuid AND "itemId" = ${itemId}::uuid FOR UPDATE`;
      const key = { enrollmentId_itemId: { enrollmentId: enrollment.id, itemId } };
      const now = new Date();
      const before = row.watchedBuckets ? popcount(row.watchedBuckets) : 0;
      const bits = mergeBuckets(row.watchedBuckets, body.buckets, total, watchBudget(row.elapsed, before));
      const watched = popcount(bits);
      await tx.itemProgress.update({
        where: key,
        data: {
          watchedBuckets: bits,
          watchedSec: Math.min(watched * BUCKET_SEC, item.durationSec),
          lastPositionSec: Math.min(body.positionSec, item.durationSec),
        },
      });
      const completed = !!row.completedAt || isWatched(watched, total);
      if (!row.completedAt && completed) await completeItem(tx, enrollment.id, item.courseId, itemId, now);
      return { completed, progressPct: await this.progressPct(tx, enrollment.id) };
    }, PROGRESS_TX);
  }

  // PDF / video không rõ thời lượng. completeItem giữ mốc hoàn thành đầu tiên → gọi lại vẫn 200.
  async complete(slug: string, userId: string, itemId: string) {
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    if (!isManual(item)) throw autoOnly();
    return this.prisma.$transaction(async (tx) => {
      await completeItem(tx, enrollment.id, item.courseId, itemId, new Date());
      return { completed: true as const, progressPct: await this.progressPct(tx, enrollment.id) };
    }, PROGRESS_TX);
  }

  async progressPct(tx: Prisma.TransactionClient, enrollmentId: string) {
    const e = await tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, select: { progressPct: true } });
    return Number(e.progressPct);
  }

  private findEnrollment<S extends Prisma.EnrollmentSelect>(slug: string, userId: string, select?: S) {
    return this.prisma.enrollment.findFirst({
      where: { userId, course: { slug } },
      select: { id: true, ...select } as S & { id: true },
    });
  }
}
