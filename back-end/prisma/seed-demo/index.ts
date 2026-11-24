import prismaPkg from '@prisma/client';
import type { Occupation } from '@prisma/client';
import { SEED_DATA } from './data/index.ts';
import { validateData, validateDb, validateShowcase, validateSkillAbilities, MIN_VIDEO_SEC } from './validate.ts';
import { DAY, mulberry32 } from './rng.ts';
import { writeUsers } from './users.ts';
import { courseSlug, writeCourse, type SeededCourse } from './courses.ts';
import { SKILL_ABILITIES } from './data/skill-abilities.ts';
import { planSkillHistory, writeSkillHistory } from './skills.ts';
import { planActivity, writeActivity } from './activity.ts';
import { renderThumbnail, r2 as makeR2, type R2 } from './thumbnails.ts';
import { coverageReport, recomputeStats } from './stats.ts';
import { cleanSeed } from './clean.ts';
import { DEMO_PASSWORD } from './users.ts';
import { v7 as uuidv7 } from 'uuid';
import { thetaBank } from './assessment-sim.ts';
import { SHOWCASE } from './data/analytics-demo.ts';
import { planShowcase, planShowcaseLearners } from './showcase.ts';
import { planShowcaseOrders } from './orders.ts';
import { planWatching, writeWatching } from './watching.ts';
import { planFunnelEvents, writeFunnelEvents } from './funnel-events.ts';
import { planShowcaseExtras, writeShowcaseQuestions } from './demo-extras.ts';

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

    const errors = [...validateData(SEED_DATA), ...validateShowcase(SEED_DATA), ...validateSkillAbilities(SEED_DATA), ...(await validateDb(prisma, SEED_DATA))];
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

    // Khoá trình diễn dashboard: xuất bản cố định ~240 ngày trước; học viên giả lập dùng luồng rng riêng để không xáo dữ liệu khác.
    const showRng = mulberry32(SEED + 2);
    const showPublishedAt = new Date(now.getTime() - SHOWCASE.publishedDaysAgo * DAY);
    const learners = planShowcaseLearners(showRng, { now, publishedAt: showPublishedAt, count: SHOWCASE.learners, mix: SHOWCASE.personaMix });
    const showUsers = await writeUsers(prisma, learners.map((l) => l.user), { rng: showRng, now, instructorEmails, topicIdBySlug, occupationTopicIds });
    log(`✓ ${showUsers.size} học viên giả lập cho khoá trình diễn`);

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
        seeded.push(await writeCourse(prisma, c, ctx, url, slug, c.title === SHOWCASE.courseTitle ? showPublishedAt : undefined));
      } catch (e) {
        await r2.removeUrl(url).catch(() => {});
        throw new Error(`Ghi khoá "${c.title}" (${slug}) lỗi: ${String(e)}`);
      }
    }
    log(`✓ ${seeded.length} khoá`);

    const published = seeded.filter((c) => c.status === 'published').map((c) => ({ ...c, publishedAt: c.publishedAt! }));
    // Lượt quiz / bài nộp khớp tiến độ (luồng rng riêng); khoá trình diễn dùng tham số câu có lỗi cài sẵn.
    const simRng = mulberry32(SEED + 1);
    const show = published.find((c) => c.title === SHOWCASE.courseTitle)!;
    // planActivity phải thấy khoá trình diễn là free (giá thật làm nó gọi rng thêm → xáo luồng rng chính); đơn của học viên thường
    // vào khoá trình diễn sinh sau bằng planShowcaseOrders (không gọi rng).
    const sharePct = Number(share.value);
    const plan = planActivity({
      users: [...users.values()].map((u) => ({ id: u.id, createdAt: u.createdAt, topicIds: u.topicIds })),
      courses: published.map((c) => (c.id === show.id ? { ...c, priceAmount: 0 } : c)), sharePct, now,
    }, rng, { rng: simRng, id: uuidv7, theta: thetaBank(simRng), params: new Map([[show.id, SHOWCASE.questions]]) });
    const mainShow = planShowcaseOrders(plan.enrollments.filter((e) => e.courseId === show.id), {
      courseId: show.id, instructorId: show.instructorId, priceAmount: show.priceAmount, sharePct, id: uuidv7,
    });
    for (const e of plan.enrollments) if (e.courseId === show.id) e.orderId = mainShow.orderIdByUser.get(e.userId)!;
    await writeActivity(prisma, { ...plan, orders: [...plan.orders, ...mainShow.orders], orderItems: [...plan.orderItems, ...mainShow.orderItems] });
    log(`✓ ${plan.enrollments.length} ghi danh, ${plan.orders.length + mainShow.orders.length} đơn (${mainShow.orders.length} ở khoá trình diễn), ${plan.progress.length} item đã học, ${plan.reviews.length} đánh giá, ${plan.attempts.length} lượt quiz, ${plan.submissions.length} bài nộp`);

    const showPlan = planShowcase(showRng, {
      now,
      course: { id: show.id, items: show.items, quiz: show.quiz!, exercise: show.exercise! },
      learners: learners.map((l) => ({ ...l, userId: showUsers.get(l.user.email)!.id })),
      params: SHOWCASE.questions, bugs: SHOWCASE.bugs, exerciseB: SHOWCASE.exerciseB, gainRating: SHOWCASE.gainRating, id: uuidv7,
    });
    // Khoá trình diễn có phí (huy.do đã xác minh): mỗi ghi danh một đơn paid đúng lúc ghi danh — không gọi rng.
    const showOrders = planShowcaseOrders(showPlan.enrollments, {
      courseId: show.id, instructorId: show.instructorId, priceAmount: show.priceAmount, sharePct, id: uuidv7,
    });
    for (const e of showPlan.enrollments) e.orderId = showOrders.orderIdByUser.get(e.userId) ?? null;
    const extras = planShowcaseExtras(mulberry32(SEED + 5), {
      now, courseId: show.id, label: show.label, lectureTitles: show.lectureTitles,
      lectureIds: show.items.filter((x) => x.durationSec > 0).map((x) => x.id),
      enrollments: showPlan.enrollments, id: uuidv7,
    });
    await writeActivity(prisma, { ...showPlan, orders: showOrders.orders, orderItems: showOrders.orderItems, reviews: extras.reviews });
    await writeShowcaseQuestions(prisma, extras.questions);
    log(`✓ Khoá trình diễn: ${showPlan.enrollments.length} ghi danh (${showOrders.orders.length} đơn), ${showPlan.attempts.length} lượt quiz, ${showPlan.submissions.length} bài nộp, ${extras.reviews.length} đánh giá, ${extras.questions.length} câu hỏi`);

    // Đoạn video đã xem + bài đang dở (mọi ghi danh seed; khoá trình diễn có mẫu cài sẵn).
    const watch = planWatching(mulberry32(SEED + 3), {
      now,
      courses: published.map((c) => ({ id: c.id, items: c.items })),
      enrollments: [...plan.enrollments, ...showPlan.enrollments].map((e) => ({
        id: e.id, courseId: e.courseId, at: e.at, completedAt: e.completedAt, lastAccessedAt: e.lastAccessedAt,
      })),
      progress: [...plan.progress, ...showPlan.progress],
      planted: { courseId: show.id, ...SHOWCASE.video },
      id: uuidv7,
    });
    await writeWatching(prisma, watch);
    log(`✓ ${watch.segments.length} đoạn video, ${watch.open.length} bài đang xem dở`);

    // Sự kiện phễu + đơn failed (bỏ ngang ở Stripe).
    const funnelPlan = planFunnelEvents(mulberry32(SEED + 4), {
      now,
      courses: published.map((c) => ({ id: c.id, instructorId: c.instructorId, priceAmount: c.priceAmount, publishedAt: c.publishedAt })),
      enrollments: [...plan.enrollments, ...showPlan.enrollments].map((e) => ({ userId: e.userId, courseId: e.courseId, at: e.at })),
      userIds: [...users.values(), ...showUsers.values()].map((u) => u.id),
      sharePct, id: uuidv7,
    });
    await writeFunnelEvents(prisma, funnelPlan);
    log(`✓ ${funnelPlan.events.length} sự kiện phễu, ${funnelPlan.failed.length} đơn bỏ ngang`);

    const skillQs = await prisma.skillQuestion.findMany({
      where: { archivedAt: null }, select: { id: true, topicId: true, rating: true, answerCount: true, correctCount: true },
    });
    const byTopic = new Map<string, typeof skillQs>();
    for (const q of skillQs) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);
    const skillPlan = planSkillHistory({
      now,
      learners: [
        ...Object.entries(SKILL_ABILITIES).flatMap(([email, abilities]) =>
          Object.entries(abilities).map(([slug, ability]) => ({ userId: users.get(email)!.id, topicId: topicIdBySlug.get(slug)!, ability })),
        ),
        // Khoá trình diễn: lịch đo trước / sau ghi danh → "Năng lực lớp" có số liệu thay đổi trong thời gian học.
        ...showPlan.skill.map((s) => ({ userId: s.userId, topicId: topicIdBySlug.get('javascript')!, ability: s.schedule[0].ability, schedule: s.schedule })),
      ],
      questions: byTopic,
    }, rng);
    await writeSkillHistory(prisma, skillPlan);
    log(`✓ ${skillPlan.attempts.length} lượt đánh giá kỹ năng (${Object.keys(SKILL_ABILITIES).length} học viên mẫu + ${showPlan.skill.length} học viên khoá trình diễn)`);

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
    log('Dashboard giảng viên: huy.do@skillpath.test → Phân tích, khoá "JavaScript nền tảng cho người mới"');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
