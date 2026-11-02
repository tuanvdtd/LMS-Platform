import prismaPkg from '@prisma/client';
import type { Occupation } from '@prisma/client';
import { SEED_DATA } from './data/index.ts';
import { validateData, validateDb, MIN_VIDEO_SEC } from './validate.ts';
import { mulberry32 } from './rng.ts';
import { writeUsers } from './users.ts';
import { courseSlug, writeCourse, type SeededCourse } from './courses.ts';
import { planActivity, writeActivity } from './activity.ts';
import { renderThumbnail, r2 as makeR2, type R2 } from './thumbnails.ts';
import { coverageReport, recomputeStats } from './stats.ts';
import { cleanSeed } from './clean.ts';
import { DEMO_PASSWORD } from './users.ts';

const { PrismaClient } = prismaPkg;
const SEED = 20261102;
const log = (s: string) => console.log(s);

async function main() {
  const cmd = process.argv[2];
  if (cmd !== 'seed' && cmd !== 'clean') throw new Error('Dùng: index.ts seed | clean');
  if (process.env.NODE_ENV === 'production') throw new Error('Không chạy seed demo trên production');

  const prisma = new PrismaClient();
  try {
    // Thiếu cấu hình R2 thì clean vẫn xoá DB, chỉ bỏ qua xoá ảnh; seed thì validateDb sẽ báo thiếu env.
    let r2: R2 | null = null;
    try { r2 = makeR2(); } catch (e) { log(`⚠ Bỏ qua R2: ${String(e)}`); }
    await cleanSeed(prisma, r2, log);
    if (cmd === 'clean') return;

    const errors = [...validateData(SEED_DATA), ...(await validateDb(prisma, SEED_DATA))];
    if (errors.length || !r2) throw new Error(`Dữ liệu seed chưa hợp lệ:\n- ${errors.join('\n- ')}`);

    const rng = mulberry32(SEED);
    const now = new Date();
    const topics = await prisma.topic.findMany({ select: { id: true, slug: true } });
    const topicIdBySlug = new Map(topics.map((t) => [t.slug, t.id]));
    const occ = await prisma.occupationTopic.findMany({ select: { occupation: true, topicId: true } });
    const occupationTopicIds = new Map<Occupation, string[]>();
    for (const o of occ) occupationTopicIds.set(o.occupation, [...(occupationTopicIds.get(o.occupation) ?? []), o.topicId]);
    const cats = await prisma.category.findMany({ select: { id: true, slug: true, parent: { select: { slug: true } } } });
    const categoryBySlug = new Map(cats.map((c) => [c.slug, { id: c.id, rootSlug: c.parent?.slug ?? c.slug }]));
    const admin = await prisma.user.findFirstOrThrow({ where: { role: { contains: 'admin' } }, select: { id: true } });
    const videos = await prisma.asset.findMany({
      where: { kind: 'video', status: 'ready', durationSec: { gte: MIN_VIDEO_SEC } },
      select: { id: true, durationSec: true }, orderBy: { createdAt: 'asc' },
    });
    const share = await prisma.platformSetting.findUniqueOrThrow({ where: { key: 'revenue_share_pct' } });

    const instructorEmails = new Set(SEED_DATA.courses.map((c) => c.instructorEmail));
    const users = await writeUsers(prisma, SEED_DATA.users, { rng, now, instructorEmails, topicIdBySlug, occupationTopicIds });
    log(`✓ ${users.size} user`);

    const ctx = {
      rng, now, adminId: admin.id, users, categoryBySlug, topicIdBySlug,
      videos: videos.map((v) => ({ id: v.id, durationSec: v.durationSec! })), videoCursor: { i: 0 },
    };
    const seeded: SeededCourse[] = [];
    for (const c of SEED_DATA.courses) {
      const teacher = users.get(c.instructorEmail)!;
      const slug = courseSlug(rng, c.title);
      const key = `thumbnails/${teacher.id}/${crypto.randomUUID()}.png`;
      const url = await r2.upload(key, renderThumbnail({ ...c.thumbnail, rootSlug: categoryBySlug.get(c.categorySlug)!.rootSlug, seed: slug }));
      try {
        seeded.push(await writeCourse(prisma, c, ctx, url, slug));
      } catch (e) {
        await r2.removeUrl(url).catch(() => {});
        throw new Error(`Ghi khoá "${c.title}" (${slug}) lỗi: ${String(e)}`);
      }
    }
    log(`✓ ${seeded.length} khoá`);

    const published = seeded.filter((c) => c.status === 'published').map((c) => ({ ...c, publishedAt: c.publishedAt! }));
    const plan = planActivity({
      users: [...users.values()].map((u) => ({ id: u.id, createdAt: u.createdAt, topicIds: u.topicIds })),
      courses: published, sharePct: Number(share.value), now,
    }, rng);
    await writeActivity(prisma, plan);
    log(`✓ ${plan.enrollments.length} ghi danh, ${plan.orders.length} đơn, ${plan.progress.length} item đã học, ${plan.reviews.length} đánh giá`);

    await recomputeStats(prisma);
    const cov = await coverageReport(prisma);
    console.table(cov.rows);
    if (!cov.ok) throw new Error('Còn topic nghề chưa có khoá published (xem cột missing)');

    const [check] = await prisma.$queryRawUnsafe<{ empty: number; badSplit: number }[]>(`
      SELECT (SELECT COUNT(*) FROM courses c JOIN "user" u ON u.id = c."instructorId"
                WHERE u.email LIKE '%@skillpath.test' AND c.status = 'published' AND c."enrollmentCount" = 0)::int AS "empty",
             (SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i."orderId"
                WHERE o."providerSessionId" LIKE 'cs_seed_%' AND i."platformFeeAmount" + i."instructorEarnAmount" <> i."unitPriceAmount")::int AS "badSplit"`);
    if (check.empty || check.badSplit) throw new Error(`Kiểm tra sau seed lỗi: ${check.empty} khoá published không có học viên, ${check.badSplit} dòng đơn chia tiền sai`);
    log('✓ Mọi khoá published có học viên, mọi dòng đơn có fee + earn = unit');

    const byStatus = seeded.reduce<Record<string, number>>((m, c) => ((m[c.status] = (m[c.status] ?? 0) + 1), m), {});
    log(`Khoá theo trạng thái: ${JSON.stringify(byStatus)}`);
    log(`Mật khẩu chung: ${DEMO_PASSWORD}`);
    log(`Thử đăng nhập: lananh.nguyen@skillpath.test (frontend), thao.nguyen@skillpath.test (data), phuc.kieu@skillpath.test (QA)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
