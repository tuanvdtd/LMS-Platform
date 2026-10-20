import type { Prisma } from '@prisma/client';

// Hoàn thành item (quiz đạt, bài code accepted) + tính lại tiến độ. Khoá dòng enrollment: 2 item xong song song không
// ghi đè progressPct/completedAt của nhau. Giữ mốc hoàn thành đầu tiên.
export async function completeItem(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  courseId: string,
  itemId: string,
  now: Date,
) {
  const [locked] = await tx.$queryRaw<{ completedAt: Date | null }[]>`
    SELECT "completedAt" FROM enrollments WHERE id = ${enrollmentId}::uuid FOR UPDATE`;
  const key = { enrollmentId, itemId };
  await tx.itemProgress.upsert({ where: { enrollmentId_itemId: key }, create: { ...key, completedAt: now }, update: {} });
  await tx.itemProgress.updateMany({ where: { ...key, completedAt: null }, data: { completedAt: now } });
  const [done, total] = await Promise.all([
    tx.itemProgress.count({ where: { enrollmentId, completedAt: { not: null }, item: { isPublished: true } } }),
    tx.curriculumItem.count({ where: { courseId, isPublished: true } }),
  ]);
  await tx.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPct: total ? Math.round((done / total) * 10_000) / 100 : 0,
      completedAt: done >= total ? (locked?.completedAt ?? now) : undefined,
    },
  });
}
