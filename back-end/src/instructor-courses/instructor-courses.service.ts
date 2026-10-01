import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { imageInfo, THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '../assets/file-check.js';
import { type FieldError, isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { buildChecklist } from './course-checklist.js';
import type { UpdateCourseInput } from './instructor-courses.schemas.js';
import { courseSlug } from './slugify.js';

const REF = { select: { id: true, slug: true, name: true } } as const;
const COURSE_SELECT = {
  id: true,
  slug: true,
  status: true,
  title: true,
  subtitle: true,
  description: true,
  language: true,
  level: true,
  track: true,
  thumbnailUrl: true,
  promoVideoUrl: true,
  learningObjectives: true,
  requirements: true,
  targetAudience: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true, parent: REF } },
  topics: { where: { isPrimary: true }, select: { topic: REF } },
} satisfies Prisma.CourseSelect;
export type CourseRow = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>;
export type LectureStats = { published: number; videoSeconds: number };

// DB dev là pooler Supabase ở xa (~1-2s/query): mặc định 5s của interactive transaction không đủ.
export const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 };

@Injectable()
export class InstructorCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Trùng slug (P2002) → sinh hậu tố mới, thử 1 lần nữa (spec §4.1). Khoá mới không đụng
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
    const course = await this.assertOwned(id, instructorId);
    const stats = await this.lectureStats([course.id]);
    const { topics, ...rest } = course;
    return {
      ...rest,
      primaryTopic: topics[0]?.topic ?? null,
      checklist: this.checklistFor(course, stats.get(course.id)),
    };
  }

  async update(id: string, instructorId: string, body: UpdateCourseInput) {
    await this.assertEditable(id, instructorId);
    const { primaryTopicId, ...fields } = body;

    const errors: FieldError[] = [];
    if (fields.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: fields.categoryId },
        select: { parentId: true },
      });
      if (!category?.parentId) errors.push({ path: ['categoryId'], message: 'Hãy chọn một thể loại con' });
    }
    if (primaryTopicId) {
      const topic = await this.prisma.topic.findUnique({ where: { id: primaryTopicId }, select: { id: true } });
      if (!topic) errors.push({ path: ['primaryTopicId'], message: 'Chủ đề không tồn tại' });
    }
    if (errors.length) throw validationError(errors);

    await this.prisma.$transaction(
      async (tx) => {
        // updatedAt gán tay: PATCH chỉ đổi topic chính cũng phải đẩy khoá lên đầu danh sách.
        await tx.course.update({ where: { id }, data: { ...fields, updatedAt: new Date() } });
      if (primaryTopicId === undefined) return;
      // Tối đa 1 isPrimary/khoá (uq_course_primary_topic): xoá dòng chính cũ trước, rồi upsert
      // vì topic mới có thể đã gắn dạng không chính (PK courseId + topicId).
      await tx.courseTopic.deleteMany({
        where: { courseId: id, isPrimary: true, ...(primaryTopicId ? { topicId: { not: primaryTopicId } } : {}) },
      });
      if (primaryTopicId) {
        await tx.courseTopic.upsert({
          where: { courseId_topicId: { courseId: id, topicId: primaryTopicId } },
          create: { courseId: id, topicId: primaryTopicId, isPrimary: true },
          update: { isPrimary: true },
        });
      }
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

  // Không phải chủ khoá cũng trả 404 để không lộ khoá của người khác (spec course-create-basics §4.1).
  // Module curriculum dùng lại (spec curriculum-upload §4.1).
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
    if (course.status === 'in_review') {
      throw new ConflictException({
        statusCode: 409,
        code: 'COURSE_LOCKED',
        message: 'Khoá học đang chờ duyệt, không sửa được',
      });
    }
    return course;
  }

  // Ảnh bìa (spec curriculum-upload §4.3): key do POST /instructor/assets/uploads sinh, ảnh đã nằm trên R2 public.
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
    const oldKey = this.storage.keyOfPublicUrl(course.thumbnailUrl);
    // Xoá ảnh cũ lỗi chỉ để lại rác trên R2, không làm hỏng request (StorageService đã gửi Sentry).
    // Cùng key gắn cho khoá khác thì giữ object.
    const shared = oldKey
      ? await this.prisma.course.count({ where: { thumbnailUrl: course.thumbnailUrl, id: { not: id } } })
      : 0;
    if (oldKey && oldKey !== key && shared === 0) await this.storage.delete('public', oldKey).catch(() => undefined);
    return this.detail(id, instructorId);
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
      hasPrimaryTopic: c.topics.length > 0,
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
}
