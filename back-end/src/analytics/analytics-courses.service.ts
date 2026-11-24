import { Injectable, NotFoundException } from '@nestjs/common';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { courseNotFound } from '../learn/learn.service.js';

export const quizNotFound = () => new NotFoundException({ statusCode: 404, code: 'QUIZ_NOT_FOUND', message: 'Không tìm thấy quiz' });
export const exerciseNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'EXERCISE_NOT_FOUND', message: 'Không tìm thấy bài code' });
export const studentNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Không tìm thấy học viên trong khoá này' });

// API phân tích chỉ chạm khoá của chính giảng viên; khoá người khác coi như không tồn tại (404).
@Injectable()
export class AnalyticsCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // courses.enrollmentCount app chưa ghi (chỉ seed tính lại) → đếm thẳng từ enrollments.
  async list(instructorId: string) {
    const rows = await this.prisma.course.findMany({
      where: { instructorId },
      select: { id: true, title: true, status: true, _count: { select: { enrollments: { where: { userId: { not: instructorId } } } } } },
    });
    return rows
      .map((c) => ({ id: c.id, title: c.title, status: c.status, enrolled: c._count.enrollments }))
      .sort((a, b) => b.enrolled - a.enrolled || a.title.localeCompare(b.title, 'vi'));
  }

  async owned(courseId: string, instructorId: string) {
    const course = isGuid(courseId)
      ? await this.prisma.course.findFirst({ where: { id: courseId, instructorId }, select: { id: true, slug: true, title: true } })
      : null;
    if (!course) throw courseNotFound();
    return course;
  }
}
