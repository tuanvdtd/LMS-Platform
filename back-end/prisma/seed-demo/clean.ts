import type { PrismaClient } from '@prisma/client';
import type { R2 } from './thumbnails.ts';

const U = `SELECT id FROM "user" WHERE email LIKE '%@skillpath.test'`;
const C = `SELECT id FROM courses WHERE "instructorId" IN (${U})`;

export async function cleanSeed(prisma: PrismaClient, r2: R2 | null, log: (s: string) => void) {
  const [{ n }] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT COUNT(*)::int AS n FROM (${U}) s`);
  if (!n) return log('Không có dữ liệu seed để xoá.');

  const [outside] = await prisma.$queryRawUnsafe<{ enrollments: number; reviews: number; items: number }[]>(`
    SELECT (SELECT COUNT(*) FROM enrollments WHERE "courseId" IN (${C}) AND "userId" NOT IN (${U}))::int AS enrollments,
           (SELECT COUNT(*) FROM course_reviews WHERE "courseId" IN (${C}) AND "userId" NOT IN (${U}))::int AS reviews,
           (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi."orderId"
              WHERE oi."courseId" IN (${C}) AND o."userId" NOT IN (${U}))::int AS items`);
  if (outside.enrollments || outside.reviews || outside.items)
    log(`⚠ Sẽ xoá cả dữ liệu của tài khoản ngoài seed trên khoá seed: ${outside.enrollments} ghi danh, ${outside.reviews} đánh giá, ${outside.items} dòng đơn hàng.`);

  const thumbs = await prisma.$queryRawUnsafe<{ url: string }[]>(`SELECT "thumbnailUrl" AS url FROM courses WHERE id IN (${C}) AND "thumbnailUrl" IS NOT NULL`);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`DELETE FROM enrollments WHERE "courseId" IN (${C}) OR "userId" IN (${U})`);
    await tx.$executeRawUnsafe(`DELETE FROM course_reviews WHERE "courseId" IN (${C}) OR "userId" IN (${U})`);
    const touched = await tx.$queryRawUnsafe<{ id: string }[]>(
      `DELETE FROM order_items WHERE "courseId" IN (${C}) OR "instructorId" IN (${U}) RETURNING "orderId" AS id`);
    await tx.$executeRawUnsafe(`DELETE FROM orders WHERE "userId" IN (${U})`);
    const ids = [...new Set(touched.map((t) => t.id))];
    if (ids.length) {
      const left = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT o.id FROM orders o WHERE o.id = ANY($1::uuid[]) AND EXISTS (SELECT 1 FROM order_items i WHERE i."orderId" = o.id)`, ids);
      if (left.length) log(`⚠ ${left.length} đơn của tài khoản ngoài seed bị bớt dòng, tổng tiền không còn khớp.`);
      await tx.$executeRawUnsafe(
        `DELETE FROM orders o WHERE o.id = ANY($1::uuid[]) AND NOT EXISTS (SELECT 1 FROM order_items i WHERE i."orderId" = o.id)`, ids);
    }
    await tx.$executeRawUnsafe(`DELETE FROM payouts WHERE "instructorId" IN (${U})`);
    await tx.$executeRawUnsafe(`DELETE FROM coupons WHERE "createdById" IN (${U})`);
    await tx.$executeRawUnsafe(`DELETE FROM announcements WHERE "authorId" IN (${U})`);
    await tx.$executeRawUnsafe(`DELETE FROM course_approvals WHERE "submittedById" IN (${U})`);
    await tx.$executeRawUnsafe(`DELETE FROM courses WHERE id IN (${C})`);
    const assets = await tx.$executeRawUnsafe(`DELETE FROM assets WHERE "ownerId" IN (${U})`);
    if (assets) log(`⚠ Đã xoá ${assets} asset do user seed tải lên; file trên storage không được xoá.`);
    await tx.$executeRawUnsafe(`DELETE FROM "user" WHERE id IN (${U})`);
  }, { timeout: 120_000 });

  if (r2) for (const { url } of thumbs) await r2.removeUrl(url).catch((e) => log(`⚠ Không xoá được ảnh ${url}: ${String(e)}`));
  log(`Đã xoá ${n} user seed và dữ liệu liên quan, ${thumbs.length} ảnh bìa.`);
}
