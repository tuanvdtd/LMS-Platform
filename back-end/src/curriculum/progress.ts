import type { Prisma } from '@prisma/client';

// Hoàn thành item (bài giảng tick tay / hết video, quiz đạt, bài code accepted) + tính lại tiến độ khoá.
// Giữ mốc hoàn thành đầu tiên của item.
export async function completeItem(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  courseId: string,
  itemId: string,
  now: Date,
) {
  const courseDoneAt = await lockEnrollment(tx, enrollmentId);
  const key = { enrollmentId, itemId };
  await tx.itemProgress.upsert({ where: { enrollmentId_itemId: key }, create: { ...key, completedAt: now }, update: {} });
  await tx.itemProgress.updateMany({ where: { ...key, completedAt: null }, data: { completedAt: now } });
  await recalcEnrollment(tx, enrollmentId, courseId, courseDoneAt, now);
}

// Bỏ hoàn thành (học viên tự bỏ tick bài giảng). Item chưa xong / chưa có dòng → chỉ tính lại, không lỗi.
export async function uncompleteItem(tx: Prisma.TransactionClient, enrollmentId: string, courseId: string, itemId: string) {
  const courseDoneAt = await lockEnrollment(tx, enrollmentId);
  await tx.itemProgress.updateMany({ where: { enrollmentId, itemId }, data: { completedAt: null } });
  await recalcEnrollment(tx, enrollmentId, courseId, courseDoneAt, new Date());
}

// Khoá dòng enrollment: 2 item đổi trạng thái song song không ghi đè progressPct/completedAt của nhau.
async function lockEnrollment(tx: Prisma.TransactionClient, enrollmentId: string) {
  const [row] = await tx.$queryRaw<{ completedAt: Date | null }[]>`
    SELECT "completedAt" FROM enrollments WHERE id = ${enrollmentId}::uuid FOR UPDATE`;
  return row?.completedAt ?? null;
}

// % = item đã xong / item đã xuất bản. Chưa đủ → khoá không còn hoàn thành; đủ → giữ mốc cũ nếu có.
async function recalcEnrollment(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  courseId: string,
  courseDoneAt: Date | null,
  now: Date,
) {
  const [done, total] = await Promise.all([
    tx.itemProgress.count({ where: { enrollmentId, completedAt: { not: null }, item: { isPublished: true } } }),
    tx.curriculumItem.count({ where: { courseId, isPublished: true } }),
  ]);
  await tx.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPct: total ? Math.round((done / total) * 10_000) / 100 : 0,
      completedAt: done >= total ? (courseDoneAt ?? now) : null,
    },
  });
}
