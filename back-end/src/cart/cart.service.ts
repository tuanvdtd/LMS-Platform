import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isGuid } from '../common/zod.pipe.js';
import { loadBuyable, loadCartCourses } from '../checkout/buyable.js';
import { priceLines, summarize } from '../checkout/pricing.js';
import { activeCoupons } from '../coupons/active-coupons.js';
import { PrismaService } from '../infra/prisma.service.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, couponCode?: string) {
    const courses = await loadCartCourses(this.prisma, userId);
    const coupons = couponCode ? await activeCoupons(this.prisma, couponCode, courses.map((c) => c.id)) : [];
    const lines = priceLines(courses, coupons);
    let couponError: string | undefined;
    if (couponCode && !lines.some((l) => l.couponId)) {
      couponError = coupons.some((c) => c.type === 'free')
        ? 'Mã miễn phí — hãy dùng ở trang khoá học'
        : 'Mã không áp dụng cho khoá nào trong giỏ';
    }
    return {
      items: courses.map((c, i) => ({
        course: { id: c.id, slug: c.slug, title: c.title, thumbnailUrl: c.thumbnailUrl, instructorName: c.instructor.name },
        listPrice: lines[i].listPriceAmount,
        finalPrice: lines[i].unitPriceAmount,
        couponApplied: lines[i].couponId !== null,
      })),
      summary: summarize(lines),
      couponError,
    };
  }

  async add(userId: string, courseId: string) {
    const course = await loadBuyable(this.prisma, userId, courseId);
    if (course.priceAmount === 0) {
      throw new BadRequestException({ statusCode: 400, code: 'FREE_COURSE', message: 'Khoá miễn phí — hãy ghi danh trực tiếp' });
    }
    try {
      await this.prisma.cartItem.create({ data: { userId, courseId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ statusCode: 409, code: 'ALREADY_IN_CART', message: 'Khoá đã có trong giỏ' });
      }
      throw e;
    }
  }

  async remove(userId: string, courseId: string) {
    if (!isGuid(courseId)) return;
    await this.prisma.cartItem.deleteMany({ where: { userId, courseId } });
  }

  // Trạng thái nút ở trang chi tiết (catalog là public + cache → không chứa dữ liệu riêng).
  async status(userId: string, courseId: string) {
    if (!isGuid(courseId)) throw new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });
    const [course, inCart, enrolled] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } }),
      this.prisma.cartItem.count({ where: { userId, courseId } }),
      this.prisma.enrollment.count({ where: { userId, courseId } }),
    ]);
    if (!course) throw new NotFoundException({ statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học' });
    return { inCart: inCart > 0, enrolled: enrolled > 0, isOwner: course.instructorId === userId };
  }
}
