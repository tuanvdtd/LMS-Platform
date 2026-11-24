import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { courseNotFound, notEnrolled } from '../learn/learn.service.js';
import { REVIEW_MIN_PROGRESS_PCT } from './reviews.schemas.js';
import type { ListReviewsQuery, SaveReviewInput } from './reviews.schemas.js';

const PAGE = 10;
const MY_REVIEW_SELECT = { rating: true, comment: true, createdAt: true, updatedAt: true } satisfies Prisma.CourseReviewSelect;

const ownCourse = () =>
  new ForbiddenException({
    statusCode: 403,
    code: 'REVIEW_OWN_COURSE',
    message: 'Bạn không thể đánh giá khoá học của chính mình',
  });
const progressRequired = (progressPct: number) =>
  new ForbiddenException({
    statusCode: 403,
    code: 'REVIEW_PROGRESS_REQUIRED',
    message: `Hãy học ít nhất ${REVIEW_MIN_PROGRESS_PCT}% khoá học để đánh giá`,
    progressPct,
    minProgressPct: REVIEW_MIN_PROGRESS_PCT,
  });

// Tính lại từ bảng đánh giá thay vì cộng trừ dồn: không lệch dù khoá đã có sẵn đánh giá từ nguồn khác.
const recalcRating = (tx: Prisma.TransactionClient, courseId: string) => tx.$executeRaw`
  UPDATE courses SET
    "ratingAvg" = COALESCE((SELECT ROUND(AVG(rating), 2) FROM course_reviews WHERE "courseId" = ${courseId}::uuid), 0),
    "ratingCount" = (SELECT COUNT(*) FROM course_reviews WHERE "courseId" = ${courseId}::uuid)
  WHERE id = ${courseId}::uuid`;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Công khai: chỉ khoá đang xuất bản.
  async list(slug: string, q: ListReviewsQuery) {
    const course = await this.prisma.course.findFirst({ where: { slug, status: 'published' }, select: { id: true } });
    if (!course) throw courseNotFound();
    const [rows, groups] = await Promise.all([
      this.prisma.courseReview.findMany({
        where: { courseId: course.id, ...(q.rating && { rating: q.rating }) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: PAGE + 1, // lấy dư 1 dòng để biết còn trang sau
        ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { id: true, name: true, image: true } } },
      }),
      // Phân bố luôn tính trên toàn bộ đánh giá của khoá, không theo bộ lọc sao.
      this.prisma.courseReview.groupBy({ by: ['rating'], where: { courseId: course.id }, _count: { _all: true } }),
    ]);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const g of groups) distribution[g.rating] = g._count._all;
    const items = rows.slice(0, PAGE);
    return {
      items: items.map(({ user, ...r }) => ({ ...r, author: user })),
      nextCursor: rows.length > PAGE ? items[PAGE - 1].id : null,
      distribution,
    };
  }

  async mine(slug: string, userId: string) {
    const { courseId, progressPct } = await this.access(slug, userId);
    const review = await this.prisma.courseReview.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: MY_REVIEW_SELECT,
    });
    return {
      review,
      progressPct,
      minProgressPct: REVIEW_MIN_PROGRESS_PCT,
      canReview: review !== null || progressPct >= REVIEW_MIN_PROGRESS_PCT,
    };
  }

  async save(slug: string, userId: string, input: SaveReviewInput) {
    const { courseId, progressPct } = await this.access(slug, userId);
    const where = { courseId_userId: { courseId, userId } };
    const data = { rating: input.rating, comment: input.comment ?? null };
    return this.prisma.$transaction(async (tx) => {
      // Ngưỡng tiến độ chỉ chặn lúc tạo: đã đánh giá rồi thì luôn sửa được, kể cả khi tiến độ tụt.
      const existing = await tx.courseReview.findUnique({ where, select: { id: true } });
      if (!existing && progressPct < REVIEW_MIN_PROGRESS_PCT) throw progressRequired(progressPct);
      const review = await tx.courseReview.upsert({
        where,
        create: { courseId, userId, ...data },
        update: data,
        select: MY_REVIEW_SELECT,
      });
      await recalcRating(tx, courseId);
      return review;
    }, TX_OPTIONS);
  }

  async remove(slug: string, userId: string) {
    const { courseId } = await this.access(slug, userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.courseReview.deleteMany({ where: { courseId, userId } });
      await recalcRating(tx, courseId);
    }, TX_OPTIONS);
  }

  // 404 khoá → 403 chủ khoá → 403 chưa ghi danh. Chủ khoá có bản ghi danh "xem trước" nên phải chặn riêng, trước bước tra ghi danh.
  // Không xét trạng thái khoá: học viên của khoá đã gỡ xuất bản vẫn sửa / xoá được đánh giá của mình.
  private async access(slug: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { slug }, select: { id: true, instructorId: true } });
    if (!course) throw courseNotFound();
    if (course.instructorId === userId) throw ownCourse();
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { progressPct: true },
    });
    if (!enrollment) throw notEnrolled();
    return { courseId: course.id, progressPct: Number(enrollment.progressPct) };
  }
}
