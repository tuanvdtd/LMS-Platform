// back-end/src/catalog/catalog.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { bucketOf } from '../assets/assets.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { StorageService } from '../infra/storage.service.js';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma.service.js';
import type { ListCoursesQuery } from './catalog.schemas.js';

// Xem thử được ngay = lecture video có asset ready; dùng chung cho curriculum() và preview() để không lệch nhau.
const canPreview = (i: {
  isPreview: boolean;
  type: string;
  lectureKind: string | null;
  videoAsset: { status: string } | null;
}) => i.isPreview && i.type === 'lecture' && i.lectureKind === 'video' && i.videoAsset?.status === 'ready';

// Card khoá public (spec public-catalog §3.1). Chỉ liệt kê trường được phép lộ ra ngoài.
export const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  thumbnailUrl: true,
  priceAmount: true,
  currency: true,
  level: true,
  ratingAvg: true,
  ratingCount: true,
  enrollmentCount: true,
  instructor: { select: { id: true, name: true } },
} satisfies Prisma.CourseSelect;
type CardRow = Prisma.CourseGetPayload<{ select: typeof CARD_SELECT }>;
export type CourseCard = Omit<CardRow, 'ratingAvg'> & { ratingAvg: number; lectureCount: number; totalDurationSec: number };

const ORDER: Record<ListCoursesQuery['sort'], Prisma.CourseOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: 'desc' }, { id: 'desc' }],
  popular: [{ enrollmentCount: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
  price_asc: [{ priceAmount: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }],
  price_desc: [{ priceAmount: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
};

const courseNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(q: ListCoursesQuery) {
    const empty = { items: [] as CourseCard[], total: 0, page: q.page, limit: q.limit, topic: null };
    const where: Prisma.CourseWhereInput = { status: 'published' };
    if (q.level) where.level = q.level;
    if (q.price) where.priceAmount = q.price === 'free' ? 0 : { gt: 0 };
    if (q.category) {
      // Taxonomy 2 cấp: category cấp 1 gồm chính nó + các con.
      const c = await this.prisma.category.findUnique({
        where: { slug: q.category },
        select: { id: true, children: { select: { id: true } } },
      });
      if (!c) return empty;
      where.categoryId = { in: [c.id, ...c.children.map((x) => x.id)] };
    }
    let topic: { slug: string; name: string } | null = null;
    if (q.topic) {
      const t = await this.prisma.topic.findUnique({ where: { slug: q.topic }, select: { id: true, slug: true, name: true } });
      if (!t) return empty;
      topic = { slug: t.slug, name: t.name };
      where.topics = { some: { topicId: t.id } };
    }
    if (q.q) where.id = { in: await this.searchIds(q.q) };

    const [total, rows] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        select: CARD_SELECT,
        orderBy: ORDER[q.sort],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);
    return { items: await this.toCards(rows), total, page: q.page, limit: q.limit, topic };
  }

  // lectureCount/totalDurationSec trên bảng courses chưa ai ghi → tính lúc đọc (spec D3).
  async toCards(rows: CardRow[]): Promise<CourseCard[]> {
    if (!rows.length) return [];
    const stats = await this.prisma.curriculumItem.groupBy({
      by: ['courseId'],
      where: { courseId: { in: rows.map((r) => r.id) }, isPublished: true, type: 'lecture' },
      _count: { _all: true },
      _sum: { durationSec: true },
    });
    const byId = new Map(stats.map((s) => [s.courseId, s]));
    return rows.map((r) => ({
      ...r,
      ratingAvg: Number(r.ratingAvg),
      lectureCount: byId.get(r.id)?._count._all ?? 0,
      totalDurationSec: byId.get(r.id)?._sum.durationSec ?? 0,
    }));
  }

  // Tìm không dấu trên title/subtitle (spec public-catalog D2). unaccent bật ở migration 20261013090000_catalog_unaccent.
  // Chưa có index → seq scan trên khoá published; đủ cho quy mô đồ án, quá chậm thì chuyển Elasticsearch.
  private async searchIds(q: string): Promise<string[]> {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM courses
      WHERE status = 'published'
        AND (unaccent(title) ILIKE unaccent(${pattern}) OR unaccent(coalesce(subtitle, '')) ILIKE unaccent(${pattern}))`;
    return rows.map((r) => r.id);
  }

  async detail(slug: string) {
    const c = await this.prisma.course.findFirst({
      where: { slug, status: 'published' },
      select: {
        ...CARD_SELECT,
        description: true,
        language: true,
        learningObjectives: true,
        requirements: true,
        targetAudience: true,
        promoVideoUrl: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { slug: true, name: true, parent: { select: { slug: true, name: true } } } },
        topics: { select: { topic: { select: { slug: true, name: true } } }, orderBy: { isPrimary: 'desc' } },
        instructor: {
          select: { id: true, name: true, image: true, instructorProfile: { select: { headline: true } } },
        },
      },
    });
    if (!c) throw courseNotFound();
    const { topics, instructor, ...rest } = c;
    const [card] = await this.toCards([{ ...rest, instructor: { id: instructor.id, name: instructor.name } }]);
    return {
      ...rest,
      ...card,
      topics: topics.map((t) => t.topic),
      instructor: {
        id: instructor.id,
        name: instructor.name,
        image: instructor.image,
        headline: instructor.instructorProfile?.headline ?? null,
      },
    };
  }

  async curriculum(slug: string) {
    const course = await this.prisma.course.findFirst({ where: { slug, status: 'published' }, select: { id: true } });
    if (!course) throw courseNotFound();
    const sections = await this.prisma.section.findMany({
      where: { courseId: course.id },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        items: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            durationSec: true,
            isPreview: true,
            lectureKind: true,
            videoAsset: { select: { status: true } },
          },
        },
      },
    });
    // isPreview công khai = "xem thử được ngay"; map lại để không lộ lectureKind/asset.
    return {
      sections: sections
        .filter((s) => s.items.length)
        .map((s) => ({
          ...s,
          items: s.items.map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            durationSec: i.durationSec,
            isPreview: canPreview(i),
          })),
        })),
    };
  }

  // Xem thử không cần mua (spec public-catalog §3.4). Video S3 private → presigned GET như admin xem lúc duyệt.
  async preview(slug: string, itemId: string) {
    const item = isGuid(itemId)
      ? await this.prisma.curriculumItem.findFirst({
          where: { id: itemId, isPublished: true, course: { slug, status: 'published' } },
          select: {
            type: true,
            isPreview: true,
            lectureKind: true,
            videoAsset: { select: { kind: true, storageKey: true, status: true } },
          },
        })
      : null;
    if (!item) throw new NotFoundException({ statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'Không tìm thấy bài học' });
    const v = item.videoAsset;
    if (!canPreview(item) || !v) {
      throw new ForbiddenException({ statusCode: 403, code: 'PREVIEW_NOT_ALLOWED', message: 'Bài này không cho xem thử' });
    }
    return { url: await this.storage.presignGet(bucketOf(v.kind), v.storageKey, 3600) };
  }

  async instructor(id: string) {
    const notFound = () =>
      new NotFoundException({ statusCode: 404, code: 'INSTRUCTOR_NOT_FOUND', message: 'Không tìm thấy giảng viên' });
    if (!isGuid(id)) throw notFound();
    // role dạng "student,instructor". Select liệt kê trường: KHÔNG lấy bank*/email (spec §3.5).
    const u = await this.prisma.user.findFirst({
      where: { id, role: { contains: 'instructor' } },
      select: {
        id: true,
        name: true,
        image: true,
        instructorProfile: { select: { headline: true, bio: true, website: true, socials: true } },
      },
    });
    if (!u) throw notFound();
    const rows = await this.prisma.course.findMany({
      where: { instructorId: id, status: 'published' },
      select: CARD_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
    const p = u.instructorProfile;
    return {
      id: u.id,
      name: u.name,
      image: u.image,
      headline: p?.headline ?? null,
      bio: p?.bio ?? null,
      website: p?.website ?? null,
      socials: p?.socials ?? {},
      courses: await this.toCards(rows),
    };
  }
}
