import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';

type Db = Pick<Prisma.TransactionClient, 'course' | 'enrollment'>;

export const BUY_SELECT = { id: true, slug: true, title: true, thumbnailUrl: true, priceAmount: true, instructorId: true } as const;
export type BuyableCourse = Prisma.CourseGetPayload<{ select: typeof BUY_SELECT }>;

// Spec stripe-checkout P8: published, không phải khoá mình, chưa ghi danh.
export async function loadBuyable(db: Db, userId: string, courseId: string): Promise<BuyableCourse> {
  const course = isGuid(courseId)
    ? await db.course.findFirst({ where: { id: courseId, status: 'published' }, select: BUY_SELECT })
    : null;
  if (!course) throw new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });
  if (course.instructorId === userId) {
    throw new ForbiddenException({ statusCode: 403, code: 'OWN_COURSE', message: 'Bạn là giảng viên của khoá này' });
  }
  const enrolled = await db.enrollment.count({ where: { userId, courseId } });
  if (enrolled) throw new ConflictException({ statusCode: 409, code: 'ALREADY_ENROLLED', message: 'Bạn đã sở hữu khoá này' });
  return course;
}

type CartDb = Pick<Prisma.TransactionClient, 'cartItem'>;

// Khoá trong giỏ còn mua được, 1 query. Dòng không hợp lệ (gỡ xuất bản, đã ghi danh đường khác, khoá mình)
// bị bỏ qua thay vì chặn cả giỏ; fulfill / enroll tự xoá dòng giỏ khi ghi danh.
export async function loadCartCourses(db: CartDb, userId: string) {
  const rows = await db.cartItem.findMany({
    where: {
      userId,
      course: { status: 'published', priceAmount: { gt: 0 }, instructorId: { not: userId }, enrollments: { none: { userId } } },
    },
    orderBy: { addedAt: 'desc' },
    select: { course: { select: { ...BUY_SELECT, instructor: { select: { name: true } } } } },
  });
  return rows.map((r) => r.course);
}
