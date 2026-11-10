import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../infra/prisma.service.js';

// Chủ khoá xem trước khoá của mình như học viên: chưa có ghi danh thì tạo một bản.
// Không qua thanh toán → enrollmentCount (số học viên) không đổi.
// Gọi SAU khi tra ghi danh thường không thấy và bài/khoá đã chắc tồn tại (404 trước 403, bài sai không sinh ghi danh).
// Trả null khi người gọi không phải chủ khoá.
export async function ownerEnrollment<S extends Prisma.EnrollmentSelect>(
  prisma: PrismaService,
  slug: string,
  userId: string,
  select?: S,
) {
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true, instructorId: true } });
  if (!course || course.instructorId !== userId) return null;
  // skipDuplicates: 2 request đầu tiên song song không đụng unique (userId, courseId).
  await prisma.enrollment.createMany({ data: [{ userId, courseId: course.id }], skipDuplicates: true });
  return prisma.enrollment.findFirst({
    where: { userId, courseId: course.id },
    select: { id: true, ...select } as S & { id: true },
  });
}
