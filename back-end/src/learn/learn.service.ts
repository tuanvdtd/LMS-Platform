import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { bucketOf, videoUrl } from '../assets/assets.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { completeItem, uncompleteItem } from '../curriculum/progress.js';
import { tooManyRequests } from '../common/http.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { StorageService } from '../infra/storage.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { ownerEnrollment } from './enrollment.js';
import type { ProgressInput } from './learn.schemas.js';

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
  videoAsset: { select: { id: true, kind: true, storageKey: true, status: true, hlsKey: true } },
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
  new ConflictException({ statusCode: 409, code: 'PROGRESS_NOT_TRACKED', message: 'Chỉ bài video mới lưu vị trí xem' });

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
    const ENROLLMENT = { progressPct: true, completedAt: true, lastItemId: true } as const;
    const [course, found] = await Promise.all([
      this.prisma.course.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, instructorId: true } }),
      this.findEnrollment(slug, userId, ENROLLMENT),
    ]);
    if (!course) throw courseNotFound();
    const enrollment = found ?? (await ownerEnrollment(this.prisma, slug, userId, ENROLLMENT));
    if (!enrollment) throw notEnrolled();
    const [sections, done, wrongRows] = await Promise.all([
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
      // Câu sai ở lượt nộp mới nhất của từng quiz trong khoá mà có "bài giảng liên quan".
      // Duyệt questionIds của lượt: câu bỏ trống không có dòng quiz_answers vẫn tính là sai.
      this.prisma.$queryRaw<{ itemId: string; quizItemId: string; wrong: number }[]>`
        SELECT q."relatedItemId" AS "itemId", z."itemId" AS "quizItemId", COUNT(*)::int AS wrong
        FROM (
          SELECT DISTINCT ON (a."quizId") a.id, a."quizId", a."questionIds"
          FROM quiz_attempts a JOIN quizzes zq ON zq.id = a."quizId"
          WHERE a."userId" = ${userId}::uuid AND zq."courseId" = ${course.id}::uuid AND a.status = 'submitted'
          ORDER BY a."quizId", a."submittedAt" DESC, a."attemptNo" DESC
        ) last
        CROSS JOIN LATERAL unnest(last."questionIds") AS qid
        JOIN questions q ON q.id = qid AND q."relatedItemId" IS NOT NULL
        JOIN quizzes z ON z.id = last."quizId"
        LEFT JOIN quiz_answers ans ON ans."attemptId" = last.id AND ans."questionId" = qid
        WHERE ans."isCorrect" IS NOT TRUE
        GROUP BY q."relatedItemId", z."itemId"`,
    ]);
    const completed = new Set(done.map((p) => p.itemId));
    const visible = sections
      .filter((s) => s.items.length)
      .map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, completed: completed.has(i.id) })) }));
    const items = visible.flatMap((s) => s.items);
    // Chỉ giữ bài giảng + quiz học viên đang thấy trong mục lục.
    const titleOf = new Map(items.map((i) => [i.id, i.title]));
    const review = new Map<string, { itemId: string; title: string; wrongCount: number; quizzes: { itemId: string; title: string }[] }>();
    for (const r of wrongRows) {
      const title = titleOf.get(r.itemId);
      const quizTitle = titleOf.get(r.quizItemId);
      if (!title || !quizTitle) continue;
      const entry = review.get(r.itemId) ?? { itemId: r.itemId, title, wrongCount: 0, quizzes: [] };
      entry.wrongCount += r.wrong;
      entry.quizzes.push({ itemId: r.quizItemId, title: quizTitle });
      review.set(r.itemId, entry);
    }
    // "Tiếp tục học": bài mở gần nhất → bài đầu chưa xong → bài đầu.
    const resume = items.find((i) => i.id === enrollment.lastItemId) ?? items.find((i) => !i.completed) ?? items[0];
    return {
      course: { id: course.id, slug: course.slug, title: course.title },
      isOwner: course.instructorId === userId,
      progressPct: Number(enrollment.progressPct),
      completedAt: enrollment.completedAt,
      resumeItemId: resume?.id ?? null,
      sections: visible,
      review: [...review.values()].sort((a, b) => b.wrongCount - a.wrongCount),
    };
  }

  async setLastItem(slug: string, userId: string, itemId: string) {
    const [item, found] = await Promise.all([
      this.prisma.curriculumItem.findFirst({ where: { id: itemId, isPublished: true, course: { slug } }, select: { id: true } }),
      this.findEnrollment(slug, userId),
    ]);
    if (!item) throw itemNotFound();
    const enrollment = found ?? (await ownerEnrollment(this.prisma, slug, userId));
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
        select: { lastPositionSec: true, completedAt: true },
      }),
      asset?.status !== 'ready'
        ? null
        : item.lectureKind === 'video' && item.videoAsset
          ? videoUrl(this.storage, item.videoAsset)
          : this.storage.presignGet(bucketOf(asset.kind), asset.storageKey, MEDIA_TTL),
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
      resources: item.resources.map((r) => ({
        id: r.id,
        title: r.title,
        fileName: r.asset.fileName,
        sizeBytes: Number(r.asset.sizeBytes),
      })),
      progress: {
        lastPositionSec: progress?.lastPositionSec ?? 0,
        completed: !!progress?.completedAt,
      },
    };
  }

  async resource(slug: string, userId: string, resourceId: string) {
    if (!isGuid(resourceId)) throw resourceNotFound();
    const [res, found] = await Promise.all([
      this.prisma.lectureResource.findFirst({
        where: { id: resourceId, item: { isPublished: true, course: { slug } } },
        select: { asset: { select: { kind: true, storageKey: true, fileName: true, status: true } } },
      }),
      this.findEnrollment(slug, userId),
    ]);
    if (!res || res.asset.status !== 'ready') throw resourceNotFound();
    const enrollment = found ?? (await ownerEnrollment(this.prisma, slug, userId));
    if (!enrollment) throw notEnrolled();
    const { kind, storageKey, fileName } = res.asset;
    return { url: await this.storage.presignGet(bucketOf(kind), storageKey, RESOURCE_TTL, { fileName }) };
  }

  // Bài giảng đã xuất bản + có nội dung, trước ghi danh (404 trước 403); 2 query song song (DB xa).
  async loadLecture(slug: string, userId: string, itemId: string) {
    if (!isGuid(itemId)) throw lectureNotFound();
    const [item, found] = await Promise.all([
      this.prisma.curriculumItem.findFirst({
        where: { id: itemId, type: 'lecture', isPublished: true, course: { slug } },
        select: LECTURE_SELECT,
      }),
      this.findEnrollment(slug, userId),
    ]);
    if (!item?.lectureKind) throw lectureNotFound();
    const enrollment = found ?? (await ownerEnrollment(this.prisma, slug, userId));
    if (!enrollment) throw notEnrolled();
    return { item, enrollment };
  }

  // Vị trí xem dở của video. 1 câu upsert: 2 request đầu song song không đụng unique như upsert của Prisma.
  async progress(slug: string, userId: string, itemId: string, { positionSec }: ProgressInput) {
    if (!(await rateLimit(this.redis, `rl:learn-progress:${userId}`, 30, 60))) throw tooManyRequests();
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    if (item.lectureKind !== 'video') throw notTracked();
    const pos = item.durationSec > 0 ? Math.min(positionSec, item.durationSec) : positionSec;
    await this.prisma.$executeRaw`INSERT INTO item_progress ("enrollmentId", "itemId", "lastPositionSec")
      VALUES (${enrollment.id}::uuid, ${itemId}::uuid, ${pos})
      ON CONFLICT ("enrollmentId", "itemId") DO UPDATE SET "lastPositionSec" = EXCLUDED."lastPositionSec"`;
  }

  // Tick tay hoặc video phát tới cuối. completeItem giữ mốc hoàn thành đầu tiên → gọi lại vẫn 200.
  async complete(slug: string, userId: string, itemId: string) {
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    return this.prisma.$transaction(async (tx) => {
      const certificateSerial = await completeItem(tx, enrollment.id, item.courseId, itemId, new Date());
      return { completed: true as const, progressPct: await this.progressPct(tx, enrollment.id), certificateSerial };
    }, PROGRESS_TX);
  }

  // Bỏ tick. Bài chưa xong vẫn 200. Quiz/code không vào được: loadLecture chỉ nhận bài giảng.
  async uncomplete(slug: string, userId: string, itemId: string) {
    const { item, enrollment } = await this.loadLecture(slug, userId, itemId);
    return this.prisma.$transaction(async (tx) => {
      await uncompleteItem(tx, enrollment.id, item.courseId, itemId);
      return { completed: false as const, progressPct: await this.progressPct(tx, enrollment.id) };
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
