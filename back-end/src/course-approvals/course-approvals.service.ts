import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import type { Prisma } from '@prisma/client';
import { bucketOf } from '../assets/assets.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { CurriculumService } from '../curriculum/curriculum.service.js';
import { StorageService } from '../infra/storage.service.js';
import { QUIZ_SELECT, toDetail } from '../quiz/quiz.service.js';
import type { ApprovalsQuery } from './course-approvals.schemas.js';
import { PrismaService } from '../infra/prisma.service.js';
import {
  COURSE_SELECT,
  courseLocked,
  InstructorCoursesService,
  TX_OPTIONS,
} from '../instructor-courses/instructor-courses.service.js';

const SUBMITTABLE = ['draft', 'unpublished'] as const;
const PAGE_SIZE = 20;
const PERSON = { select: { id: true, name: true, email: true } } as const;
const APPROVAL_SELECT = {
  id: true,
  status: true,
  copyrightNote: true,
  reason: true,
  createdAt: true,
  reviewedAt: true,
  courseId: true,
  submittedBy: PERSON,
  reviewedBy: { select: { id: true, name: true } },
} satisfies Prisma.CourseApprovalSelect;
const CATEGORY = { select: { id: true, name: true, parent: { select: { id: true, name: true } } } } as const;

// null = admin, thấy tất cả. Mảng = id danh mục cấp 1 của moderator (khoá luôn gắn danh mục
// cấp 2 nên so parentId). Mảng rỗng → `in: []` → không thấy gì.
export type ReviewScope = string[] | null;
const inScope = (scope: ReviewScope) => (scope ? { course: { category: { parentId: { in: scope } } } } : {});

// Gửi duyệt (giảng viên) + hàng đợi duyệt (admin).
@Injectable()
export class CourseApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: InstructorCoursesService,
    private readonly curriculum: CurriculumService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  async submit(courseId: string, userId: string, note: string | null) {
    const course = await this.courses.detail(courseId, userId);
    if (!(SUBMITTABLE as readonly string[]).includes(course.status)) {
      throw courseLocked('Khoá học không ở trạng thái gửi duyệt được');
    }
    const missing = course.checklist.flatMap((c) => c.missing);
    if (missing.length) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'CHECKLIST_INCOMPLETE',
        message: 'Khoá học chưa đủ điều kiện gửi duyệt',
        missing,
      });
    }
    // Đặt giá xong mới mất hồ sơ/TK là hiếm nhưng vẫn chặn: khoá trả phí phải trả tiền được cho giảng viên.
    if (course.priceAmount > 0) {
      const p = await this.prisma.instructorProfile.findUnique({ where: { userId }, select: { bankBin: true } });
      if (!p) {
        throw new ForbiddenException({ statusCode: 403, code: 'INSTRUCTOR_NOT_VERIFIED', message: 'Cần đăng ký giảng viên cao cấp' });
      }
      if (!p.bankBin) {
        throw new BadRequestException({ statusCode: 400, code: 'PAYOUT_ACCOUNT_REQUIRED', message: 'Cần khai tài khoản ngân hàng' });
      }
    }
    await this.prisma.$transaction(async (tx) => {
      // Có điều kiện trạng thái: bấm 2 lần song song thì lần sau count = 0.
      const res = await tx.course.updateMany({
        where: { id: courseId, status: { in: [...SUBMITTABLE] } },
        data: { status: 'in_review', copyrightConfirmedAt: new Date(), updatedAt: new Date() },
      });
      if (res.count === 0) throw courseLocked();
      await tx.courseApproval.create({ data: { courseId, submittedById: userId, copyrightNote: note } });
    }, TX_OPTIONS);
    return this.courses.detail(courseId, userId);
  }

  // User vừa admin vừa moderator → coi là admin.
  async scopeOf(user: { id: string; role?: string | null }): Promise<ReviewScope> {
    if (user.role?.split(',').includes('admin')) return null;
    const rows = await this.prisma.moderatorCategory.findMany({ where: { userId: user.id }, select: { categoryId: true } });
    return rows.map((r) => r.categoryId);
  }

  // Pending: cũ nhất trước (xử lý theo thứ tự gửi); đã xử lý: mới nhất trước.
  async list(q: ApprovalsQuery, scope: ReviewScope) {
    const where = { status: q.status, ...inScope(scope) };
    const [items, total] = await Promise.all([
      this.prisma.courseApproval.findMany({
        where,
        orderBy: { createdAt: q.status === 'pending' ? 'asc' : 'desc' },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          course: {
            select: { id: true, title: true, thumbnailUrl: true, priceAmount: true, instructor: PERSON, category: CATEGORY },
          },
        },
      }),
      this.prisma.courseApproval.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: PAGE_SIZE };
  }

  // Ngoài scope → 404 như không tồn tại.
  async detail(id: string, scope: ReviewScope) {
    const approval = isGuid(id)
      ? await this.prisma.courseApproval.findFirst({ where: { id, ...inScope(scope) }, select: APPROVAL_SELECT })
      : null;
    if (!approval) throw new NotFoundException();
    const row = await this.prisma.course.findUniqueOrThrow({ where: { id: approval.courseId }, select: COURSE_SELECT });
    const [course, { sections }, quizzes, history] = await Promise.all([
      this.courses.present(row),
      this.curriculum.tree(row),
      this.prisma.quiz.findMany({ where: { courseId: row.id }, select: { itemId: true, ...QUIZ_SELECT } }),
      this.prisma.courseApproval.findMany({
        where: { courseId: row.id, id: { not: id } },
        orderBy: { createdAt: 'desc' },
        select: APPROVAL_SELECT,
      }),
    ]);
    return {
      approval,
      course,
      sections,
      quizzes: Object.fromEntries(quizzes.map(({ itemId, ...q }) => [itemId, toDetail(q)])),
      history,
    };
  }

  approve(id: string, reviewerId: string, scope: ReviewScope) {
    return this.review(id, reviewerId, scope, 'approved', null);
  }

  reject(id: string, reviewerId: string, scope: ReviewScope, reason: string) {
    return this.review(id, reviewerId, scope, 'rejected', reason);
  }

  private async review(
    id: string,
    reviewerId: string,
    scope: ReviewScope,
    status: 'approved' | 'rejected',
    reason: string | null,
  ) {
    if (!isGuid(id)) throw new NotFoundException();
    const row = await this.prisma.$transaction(async (tx) => {
      // WHERE status = pending: hai admin bấm cùng lúc thì người sau count = 0.
      // Scope nằm trong WHERE: ngoài danh mục thì không ghi gì, không phải kiểm sau.
      const res = await tx.courseApproval.updateMany({
        where: { id, status: 'pending', ...inScope(scope) },
        data: { status, reason, reviewedById: reviewerId, reviewedAt: new Date() },
      });
      const found = await tx.courseApproval.findFirst({
        where: { id, ...inScope(scope) },
        select: { courseId: true, course: { select: { title: true, publishedAt: true, instructor: { select: { email: true } } } } },
      });
      if (!found) throw new NotFoundException();
      if (res.count === 0) {
        throw new ConflictException({ statusCode: 409, code: 'ALREADY_REVIEWED', message: 'Yêu cầu này đã được xử lý' });
      }
      await tx.course.update({
        where: { id: found.courseId },
        // publishedAt chỉ ghi lần duyệt đầu → từ đó giá bị khoá.
        data:
          status === 'approved'
            ? { status: 'published', publishedAt: found.course.publishedAt ?? new Date(), updatedAt: new Date() }
            : { status: 'draft', updatedAt: new Date() },
      });
      return found;
    }, TX_OPTIONS);
    // Không await: MailService không throw, lỗi chỉ ghi log (như auth).
    void this.mail.sendCourseReviewed(row.course.instructor.email, row.course.title, status === 'approved', reason);
    return this.detail(id, scope);
  }

  // Admin xem thử video/PDF: chỉ asset gắn vào bài giảng hoặc tài nguyên của chính khoá đang duyệt.
  async assetUrl(approvalId: string, assetId: string, scope: ReviewScope) {
    const approval =
      isGuid(approvalId) && isGuid(assetId)
        ? await this.prisma.courseApproval.findFirst({ where: { id: approvalId, ...inScope(scope) }, select: { courseId: true } })
        : null;
    if (!approval) throw new NotFoundException();
    const { courseId } = approval;
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        status: 'ready',
        OR: [
          { videoItems: { some: { courseId } } },
          { documentItems: { some: { courseId } } },
          { resources: { some: { item: { courseId } } } },
        ],
      },
      select: { kind: true, storageKey: true },
    });
    if (!asset) throw new NotFoundException();
    const ttl = asset.kind === 'video' ? 3600 : 300; // như AssetsService.viewUrl
    return { url: await this.storage.presignGet(bucketOf(asset.kind), asset.storageKey, ttl) };
  }
}
