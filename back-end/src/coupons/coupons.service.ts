import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { couponProblems, vnMonthStart } from './coupon-rules.js';
import type { CreateCouponInput } from './coupons.schemas.js';

const courseNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });

const SELECT = {
  id: true, code: true, type: true, priceAmount: true, startsAt: true, endsAt: true,
  maxRedemptions: true, redeemedCount: true, disabledAt: true, createdAt: true,
} satisfies Prisma.CouponSelect;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ownCourse(courseId: string, instructorId: string) {
    if (!isGuid(courseId)) throw courseNotFound();
    const c = await this.prisma.course.findFirst({
      where: { id: courseId, instructorId },
      select: { id: true, slug: true, status: true, priceAmount: true },
    });
    if (!c) throw courseNotFound();
    return c;
  }

  async list(courseId: string, instructorId: string) {
    const course = await this.ownCourse(courseId, instructorId);
    const items = await this.prisma.coupon.findMany({ where: { courseId }, select: SELECT, orderBy: { createdAt: 'desc' } });
    return { courseSlug: course.slug, coursePriceAmount: course.priceAmount, items };
  }

  async create(courseId: string, instructorId: string, input: CreateCouponInput) {
    const course = await this.ownCourse(courseId, instructorId);
    if (course.status !== 'published') {
      throw new ConflictException({ statusCode: 409, code: 'COURSE_NOT_PUBLISHED', message: 'Khoá chưa xuất bản' });
    }
    if (course.priceAmount === 0) {
      throw new ConflictException({ statusCode: 409, code: 'COURSE_FREE', message: 'Khoá miễn phí không cần coupon' });
    }
    const now = new Date();
    // ponytail: đếm rồi tạo không khoá → 2 request song song có thể vượt 3/tháng; chấp nhận ở quy mô đồ án.
    const createdThisMonth = await this.prisma.coupon.count({ where: { courseId, createdAt: { gte: vnMonthStart(now) } } });
    const errors = couponProblems(input, { coursePriceAmount: course.priceAmount, createdThisMonth, now });
    if (errors.length) throw validationError(errors);
    try {
      return await this.prisma.coupon.create({
        data: { ...input, courseId, createdById: instructorId },
        select: SELECT,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ statusCode: 409, code: 'COUPON_CODE_TAKEN', message: 'Mã này đã dùng cho khoá' });
      }
      throw e;
    }
  }

  async disable(courseId: string, couponId: string, instructorId: string) {
    await this.ownCourse(courseId, instructorId);
    if (!isGuid(couponId)) throw new NotFoundException({ statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Không tìm thấy coupon' });
    const res = await this.prisma.coupon.updateMany({ where: { id: couponId, courseId, disabledAt: null }, data: { disabledAt: new Date() } });
    if (res.count === 0) {
      const exists = await this.prisma.coupon.count({ where: { id: couponId, courseId } });
      if (!exists) throw new NotFoundException({ statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Không tìm thấy coupon' });
    }
    return this.prisma.coupon.findUniqueOrThrow({ where: { id: couponId }, select: SELECT });
  }
}
