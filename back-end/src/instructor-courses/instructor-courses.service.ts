import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { imageInfo, mp4Duration, PROMO_MAX_BYTES, THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '../assets/file-check.js';
import { type FieldError, isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { priceChangeProblem } from '../revenue/price-guard.js';
import { buildChecklist } from './course-checklist.js';
import type { UpdateCourseInput } from './instructor-courses.schemas.js';
import { courseSlug } from './slugify.js';

const REF = { select: { id: true, slug: true, name: true } } as const;
export const COURSE_SELECT = {
  id: true,
  slug: true,
  status: true,
  priceAmount: true,
  publishedAt: true,
  title: true,
  subtitle: true,
  description: true,
  language: true,
  level: true,
  thumbnailUrl: true,
  promoVideoUrl: true,
  learningObjectives: true,
  requirements: true,
  targetAudience: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true, parent: REF } },
  topics: {
    select: { isPrimary: true, topic: REF },
    orderBy: [{ isPrimary: 'desc' }, { topic: { name: 'asc' } }],
  },
  // Lần gửi duyệt gần nhất: FE hiện lý do bị từ chối.
  approvals: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { status: true, reason: true, createdAt: true, reviewedAt: true },
  },
} satisfies Prisma.CourseSelect;
export type CourseRow = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>;
export type LectureStats = { published: number; videoSeconds: number };

// 409 COURSE_LOCKED: khoá đang chờ duyệt / không ở trạng thái cho phép thao tác.
export const courseLocked = (message = 'Khoá học đang chờ duyệt, không sửa được') =>
  new ConflictException({ statusCode: 409, code: 'COURSE_LOCKED', message });

const PRICE_MESSAGES: Record<string, string> = {
  PRICE_LOCKED: 'Giá đã khoá sau lần xuất bản đầu, đổi giá bằng coupon',
  COURSE_LOCKED: 'Chỉ đổi giá khi khoá ở bản nháp',
  INSTRUCTOR_NOT_VERIFIED: 'Cần đăng ký giảng viên cao cấp để bán khoá trả phí',
  PAYOUT_ACCOUNT_REQUIRED: 'Cần khai tài khoản ngân hàng trước khi bán khoá trả phí',
};

// DB dev là pooler Supabase ở xa (~1-2s/query): mặc định 5s của interactive transaction không đủ.
export const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 };

@Injectable()
export class InstructorCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Trùng slug (P2002) → sinh hậu tố mới, thử 1 lần nữa. Khoá mới không đụng
  // unique nào khác nên P2002 ở đây chỉ có thể là slug.
  async create(instructorId: string, title: string): Promise<{ id: string }> {
    try {
      return await this.createOnce(instructorId, title);
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      return this.createOnce(instructorId, title);
    }
  }

  async list(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId },
      orderBy: { updatedAt: 'desc' },
      select: COURSE_SELECT,
    });
    const stats = await this.lectureStats(courses.map((c) => c.id));
    return courses.map((c) => {
      const checklist = this.checklistFor(c, stats.get(c.id));
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl,
        updatedAt: c.updatedAt,
        progress: { done: checklist.filter((i) => i.done).length, total: checklist.length },
      };
    });
  }

  async detail(id: string, instructorId: string) {
    return this.present(await this.assertOwned(id, instructorId));
  }

  // Dạng trả về của một khoá (giảng viên + admin duyệt dùng chung).
  async present(course: CourseRow) {
    const stats = await this.lectureStats([course.id]);
    const { topics, approvals, ...rest } = course;
    return {
      ...rest,
      topics: topics.map(({ isPrimary, topic }) => ({ ...topic, isPrimary })),
      lastReview: approvals[0] ?? null,
      checklist: this.checklistFor(course, stats.get(course.id)),
    };
  }

  async update(id: string, instructorId: string, body: UpdateCourseInput) {
    await this.assertEditable(id, instructorId);
    const { topics, ...fields } = body;

    const errors: FieldError[] = [];
    if (fields.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: fields.categoryId },
        select: { parentId: true },
      });
      if (!category?.parentId) errors.push({ path: ['categoryId'], message: 'Hãy chọn một thể loại con' });
    }
    if (topics?.length) {
      const found = await this.prisma.topic.count({ where: { id: { in: topics.map((t) => t.id) } } });
      if (found < topics.length) errors.push({ path: ['topics'], message: 'Chủ đề không tồn tại' });
    }
    if (errors.length) throw validationError(errors);

    await this.prisma.$transaction(
      async (tx) => {
        // updatedAt gán tay: PATCH chỉ đổi topic cũng phải đẩy khoá lên đầu danh sách.
        await tx.course.update({ where: { id }, data: { ...fields, updatedAt: new Date() } });
        if (topics === undefined) return;
        // Thay cả bộ: xoá hết rồi tạo lại nên không lúc nào có 2 dòng isPrimary (uq_course_primary_topic).
        await tx.courseTopic.deleteMany({ where: { courseId: id } });
        // Quiz chỉ gắn topic của khoá: bỏ topic không còn thuộc khoá.
        await tx.quizTopic.deleteMany({
          where: { quiz: { courseId: id }, topicId: { notIn: topics.map((t) => t.id) } },
        });
        await tx.exerciseTopic.deleteMany({
          where: { exercise: { courseId: id }, topicId: { notIn: topics.map((t) => t.id) } },
        });
        await tx.courseTopic.createMany({
          data: topics.map((t) => ({ courseId: id, topicId: t.id, isPrimary: t.isPrimary })),
        });
      },
      TX_OPTIONS,
    );
    return this.detail(id, instructorId);
  }

  private createOnce(instructorId: string, title: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const course = await tx.course.create({
          data: { instructorId, title, slug: courseSlug(title) },
          select: { id: true },
        });
        await tx.section.create({
          data: {
            courseId: course.id,
            title: 'Giới thiệu',
            position: 1,
            items: { create: { courseId: course.id, type: 'lecture', title: 'Giới thiệu', position: 1 } },
          },
        });
        return course;
      },
      TX_OPTIONS,
    );
  }

  // Không phải chủ khoá cũng trả 404 để không lộ khoá của người khác.
  // Module curriculum dùng lại.
  async assertOwned(id: string, instructorId: string): Promise<CourseRow> {
    const course = isGuid(id)
      ? await this.prisma.course.findFirst({ where: { id, instructorId }, select: COURSE_SELECT })
      : null;
    if (!course) throw new NotFoundException();
    return course;
  }

  // Như assertOwned + khoá đang chờ duyệt thì không sửa được (409 COURSE_LOCKED).
  async assertEditable(id: string, instructorId: string): Promise<CourseRow> {
    const course = await this.assertOwned(id, instructorId);
    if (course.status === 'in_review') throw courseLocked();
    return course;
  }

  // Đặt giá: luật nằm ở priceChangeProblem().
  async setPrice(id: string, instructorId: string, priceAmount: number) {
    const course = await this.assertOwned(id, instructorId);
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId: instructorId },
      select: { bankBin: true },
    });
    const problem = priceChangeProblem({
      status: course.status,
      publishedAt: course.publishedAt,
      newPriceAmount: priceAmount,
      isVerified: !!profile,
      hasPayoutAccount: !!profile?.bankBin,
    });
    if (problem) {
      throw new HttpException(
        { statusCode: problem.status, code: problem.code, message: PRICE_MESSAGES[problem.code] },
        problem.status,
      );
    }
    // Điều kiện trong where chống race với submit: khoá đã in_review thì không ghi.
    const res = await this.prisma.course.updateMany({
      where: { id, status: 'draft', publishedAt: null },
      data: { priceAmount, updatedAt: new Date() },
    });
    if (res.count === 0) throw courseLocked('Chỉ đổi giá khi khoá ở bản nháp');
    return this.detail(id, instructorId);
  }

  // Ảnh bìa: key do POST /instructor/assets/uploads sinh, ảnh đã nằm trên R2 public.
  async setThumbnail(id: string, instructorId: string, key: string) {
    const course = await this.assertEditable(id, instructorId);
    const ext = new RegExp(`^thumbnails/${instructorId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).exec(key)?.[1];
    if (!ext) throw validationError([{ path: ['key'], message: 'Ảnh không hợp lệ' }]);
    const problem = await this.checkThumbnail(key, ext);
    if (problem) {
      await this.storage.delete('public', key);
      throw validationError([{ path: ['key'], message: problem }]);
    }
    await this.prisma.course.update({
      where: { id },
      data: { thumbnailUrl: this.storage.publicUrl(key), updatedAt: new Date() },
    });
    await this.dropOldPublic(id, { thumbnailUrl: course.thumbnailUrl }, key);
    return this.detail(id, instructorId);
  }

  // Video giới thiệu: như ảnh bìa, file đã nằm trên R2 public, không vào assets.
  async setPromoVideo(id: string, instructorId: string, key: string) {
    const course = await this.assertEditable(id, instructorId);
    if (!new RegExp(`^promos/${instructorId}/[0-9a-f-]{36}\\.mp4$`).test(key)) {
      throw validationError([{ path: ['key'], message: 'Video không hợp lệ' }]);
    }
    const problem = await this.checkPromo(key);
    if (problem) {
      await this.storage.delete('public', key);
      throw validationError([{ path: ['key'], message: problem }]);
    }
    await this.prisma.course.update({
      where: { id },
      data: { promoVideoUrl: this.storage.publicUrl(key), updatedAt: new Date() },
    });
    await this.dropOldPublic(id, { promoVideoUrl: course.promoVideoUrl }, key);
    return this.detail(id, instructorId);
  }

  async removePromoVideo(id: string, instructorId: string) {
    const course = await this.assertEditable(id, instructorId);
    await this.prisma.course.update({ where: { id }, data: { promoVideoUrl: null, updatedAt: new Date() } });
    await this.dropOldPublic(id, { promoVideoUrl: course.promoVideoUrl }, null);
    return this.detail(id, instructorId);
  }

  // Xoá object cũ trên R2 public: chỉ khi là file của mình, khác key mới, và không khoá nào khác dùng cùng URL.
  // Lỗi xoá chỉ để lại rác, không làm hỏng request (StorageService đã gửi Sentry).
  private async dropOldPublic(
    id: string,
    old: { thumbnailUrl: string | null } | { promoVideoUrl: string | null },
    newKey: string | null,
  ) {
    const url = Object.values(old)[0];
    const oldKey = this.storage.keyOfPublicUrl(url);
    if (!oldKey || oldKey === newKey) return;
    const shared = await this.prisma.course.count({ where: { ...old, id: { not: id } } });
    if (shared === 0) await this.storage.delete('public', oldKey).catch(() => undefined);
  }

  // Lecture đã xuất bản + tổng giây video của chúng, một query cho nhiều khoá.
  private async lectureStats(courseIds: string[]): Promise<Map<string, LectureStats>> {
    const rows = await this.prisma.curriculumItem.groupBy({
      by: ['courseId', 'lectureKind'],
      where: { courseId: { in: courseIds }, type: 'lecture', isPublished: true },
      _count: { _all: true },
      _sum: { durationSec: true },
    });
    const stats = new Map<string, LectureStats>();
    for (const r of rows) {
      const s = stats.get(r.courseId) ?? { published: 0, videoSeconds: 0 };
      s.published += r._count._all;
      if (r.lectureKind === 'video') s.videoSeconds += r._sum.durationSec ?? 0;
      stats.set(r.courseId, s);
    }
    return stats;
  }

  checklistFor(c: CourseRow, s: LectureStats | undefined) {
    return buildChecklist({
      ...c,
      hasPrimaryTopic: c.topics.some((t) => t.isPrimary),
      categoryDepth: c.category ? (c.category.parent ? 2 : 1) : null,
      publishedLectureCount: s?.published ?? 0,
      videoSeconds: s?.videoSeconds ?? 0,
    });
  }

  private async checkThumbnail(key: string, ext: string): Promise<string | null> {
    const head = await this.storage.head('public', key);
    if (!head) return 'Chưa tải ảnh lên';
    if (head.size > THUMBNAIL_MAX_BYTES) return 'Ảnh tối đa 5 MB';
    // Đọc cả ảnh (≤5 MB): JPEG có EXIF lớn có thể đặt kích thước sau 64 KB đầu.
    const info = imageInfo(await this.storage.read('public', key));
    if (!info || info.type !== ext) return 'File không phải ảnh JPG, PNG hoặc WebP';
    if (info.width < THUMBNAIL_MIN.width || info.height < THUMBNAIL_MIN.height) {
      return `Ảnh tối thiểu ${THUMBNAIL_MIN.width}×${THUMBNAIL_MIN.height} px`;
    }
    return null;
  }

  private async checkPromo(key: string): Promise<string | null> {
    const head = await this.storage.head('public', key);
    if (!head) return 'Chưa tải video lên';
    if (head.size > PROMO_MAX_BYTES) return 'Video giới thiệu tối đa 200 MB';
    const seconds = await mp4Duration((offset, length) => this.storage.read('public', key, { offset, length }), head.size);
    return seconds === null ? 'File không phải video MP4 hợp lệ' : null;
  }
}
