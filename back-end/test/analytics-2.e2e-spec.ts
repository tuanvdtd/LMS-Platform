import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const SLOW = 120_000; // DB dev ~1-2s/query
const REJECTED_TITLE = 'Khoá e2e bị từ chối';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const A = '/api/instructor/analytics';
const LEARNERS = 25;

type TestUser = { id: string; cookie: string };

describe('Dashboard phân tích giảng viên: tổng quan, hành vi học, doanh thu (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn(), sendCourseNudge: vi.fn() };
  let alice: TestUser; // chủ khoá A
  let bob: TestUser; // giảng viên khác
  // Khoá A: 25 học viên (ghi danh 30 ngày trước) + chính alice; 3 item (video 300 s, video 120 s, quiz).
  let courseA: string;
  let item1: string;
  let item2: string;
  let quizItem: string;
  let learnerIds: string[] = [];
  let enrollmentIds: string[] = [];
  // Khoá B (199.000đ): 10 người mua, 2 đơn failed, 60 khách ẩn danh.
  let courseB: string;
  let buyerIds: string[] = []; // gồm cả 2 người đơn failed (để afterAll xoá đơn)

  const get = (path: string, cookie: string) =>
    request(app.getHttpServer()).get(path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp()).set('Cookie', cookie);
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (name: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    const post = (path: string, body: object) =>
      request(app.getHttpServer()).post(path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp()).send(body);
    await post('/api/auth/sign-up/email', { name, email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await post('/api/auth/sign-in/email', { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .overrideProvider(StorageService)
      .useValue(new FakeStorage())
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, bob] = await Promise.all([makeUser('Alice Nguyễn'), makeUser('Bob')]);

    // Học viên + ghi danh: không cần đăng nhập nên tạo thẳng một lượt.
    learnerIds = Array.from({ length: LEARNERS }, () => randomUUID());
    const learnerEmails = learnerIds.map((id) => `e2e-${id}@example.com`);
    emails.push(...learnerEmails);
    await prisma.user.createMany({
      data: learnerIds.map((id, i) => ({ id, email: learnerEmails[i], name: `Học viên ${i + 1}`, emailVerified: true })),
    });

    const assets = await Promise.all(
      [1, 2].map(() =>
        prisma.asset.create({
          data: { ownerId: alice.id, kind: 'video', fileName: 'e2e.mp4', mimeType: 'video/mp4', sizeBytes: BigInt(2048), storageKey: `e2e/${randomUUID()}.mp4`, status: 'ready' },
          select: { id: true },
        }),
      ),
    );
    courseA = (
      await prisma.course.create({
        data: { instructorId: alice.id, priceAmount: 0, title: 'Khoá e2e hành vi học', slug: `e2e-eng-${randomUUID()}`, status: 'published', publishedAt: daysAgo(40) },
        select: { id: true },
      })
    ).id;
    const section = await prisma.section.create({ data: { courseId: courseA, title: 'Phần 1', position: 0 } });
    const video = (i: number, durationSec: number) =>
      prisma.curriculumItem.create({
        data: {
          sectionId: section.id, courseId: courseA, type: 'lecture', lectureKind: 'video', videoAssetId: assets[i].id,
          title: `Video ${i + 1}`, position: i, durationSec, isPublished: true,
        },
        select: { id: true },
      });
    const [v1, v2, q] = await Promise.all([
      video(0, 300),
      video(1, 120),
      prisma.curriculumItem.create({
        data: { sectionId: section.id, courseId: courseA, type: 'quiz', title: 'Quiz', position: 2, isPublished: true },
        select: { id: true },
      }),
    ]);
    [item1, item2, quizItem] = [v1.id, v2.id, q.id];
    await prisma.quiz.create({ data: { itemId: quizItem, courseId: courseA, passScorePct: 70 } });

    // Ghi danh 25 học viên + alice (alice phải bị loại khỏi mọi số liệu).
    enrollmentIds = learnerIds.map(() => randomUUID());
    const aliceEnrollment = randomUUID();
    await prisma.enrollment.createMany({
      data: [
        ...learnerIds.map((userId, i) => ({ id: enrollmentIds[i], userId, courseId: courseA, createdAt: daysAgo(30), lastAccessedAt: daysAgo(2) })),
        { id: aliceEnrollment, userId: alice.id, courseId: courseA, createdAt: daysAgo(30) },
      ],
    });

    // Video 1: 20 người xem hết [0,300], 5 người bỏ ở 150; 8 người đầu xem lại [100,140] sau 1 phút.
    const at = daysAgo(2);
    const later = new Date(at.getTime() + 60_000);
    const viewIds = enrollmentIds.map(() => randomUUID());
    await prisma.videoWatchSegment.createMany({
      data: [
        ...enrollmentIds.map((enrollmentId, i) => ({ id: randomUUID(), enrollmentId, itemId: item1, viewId: viewIds[i], seq: 0, startSec: 0, endSec: i < 20 ? 300 : 150, createdAt: at })),
        ...enrollmentIds.slice(0, 8).map((enrollmentId, i) => ({ id: randomUUID(), enrollmentId, itemId: item1, viewId: viewIds[i], seq: 1, startSec: 100, endSec: 140, createdAt: later })),
        { id: randomUUID(), enrollmentId: aliceEnrollment, itemId: item1, viewId: randomUUID(), seq: 0, startSec: 0, endSec: 300, createdAt: at },
      ],
    });
    // Hoàn thành: item 1 cho 20 người xem hết, item 2 cho 5 người.
    await prisma.itemProgress.createMany({
      data: [
        ...enrollmentIds.slice(0, 20).map((enrollmentId) => ({ enrollmentId, itemId: item1, completedAt: at })),
        ...enrollmentIds.slice(0, 5).map((enrollmentId) => ({ enrollmentId, itemId: item2, completedAt: at })),
      ],
    });

    // Khoá B + hồ sơ nhận tiền của alice + người mua / đơn failed / lượt xem (doanh thu & phễu).
    await prisma.instructorProfile.create({ data: { userId: alice.id, bankBin: '970436', bankAccountNo: '1023884766', bankAccountName: 'ALICE NGUYEN' } });
    courseB = (
      await prisma.course.create({
        data: { instructorId: alice.id, priceAmount: 199000, title: 'Khoá e2e doanh thu', slug: `e2e-sales-${randomUUID()}`, status: 'published', publishedAt: daysAgo(60) },
        select: { id: true },
      })
    ).id;
    const ids = (n: number) => Array.from({ length: n }, () => randomUUID());
    const paidIds = ids(10);
    const failedIds = ids(2);
    const allIds = [...paidIds, ...failedIds];
    buyerIds = allIds;
    const allEmails = allIds.map((id) => `e2e-${id}@example.com`);
    emails.push(...allEmails);
    await prisma.user.createMany({ data: allIds.map((id, i) => ({ id, email: allEmails[i], name: `Người mua ${i + 1}`, emailVerified: true })) });
    const when = daysAgo(3);
    const orders = allIds.map((userId, i) => ({ id: randomUUID(), userId, paid: i < 10 }));
    await prisma.order.createMany({
      data: orders.map((o) => ({
        id: o.id, userId: o.userId, status: o.paid ? ('paid' as const) : ('failed' as const), subtotalAmount: 199000, totalAmount: 199000,
        providerSessionId: `e2e-${o.id}`, paidAt: o.paid ? when : null, createdAt: when,
      })),
    });
    await prisma.orderItem.createMany({
      data: orders.map((o) => ({
        id: randomUUID(), orderId: o.id, courseId: courseB, instructorId: alice.id, listPriceAmount: 199000, unitPriceAmount: 199000,
        instructorEarnAmount: 139300, platformFeeAmount: 59700,
      })),
    });
    await prisma.enrollment.createMany({
      data: orders.filter((o) => o.paid).map((o) => ({ id: randomUUID(), userId: o.userId, courseId: courseB, orderId: o.id, createdAt: when })),
    });
    const ev = (kind: 'page_view' | 'cart_add', userId: string | null, visitorId: string | null, d: number) => ({
      id: randomUUID(), courseId: courseB, kind, userId, visitorId, createdAt: daysAgo(d),
    });
    await prisma.courseEvent.createMany({
      data: [
        ...ids(60).map((v) => ev('page_view', null, v, 4)),
        ...allIds.map((u) => ev('page_view', u, randomUUID(), 5)),
        ...[...paidIds.slice(0, 8), ...failedIds].map((u) => ev('cart_add', u, null, 4)),
      ],
    });
    // Tổng quan: 1 câu hỏi chưa trả lời (4 ngày trước) + 1 đánh giá 2★ (2 ngày trước) của người mua.
    await prisma.courseQuestion.create({ data: { courseId: courseB, userId: paidIds[0], body: 'Câu hỏi e2e chưa trả lời', createdAt: daysAgo(4) } });
    await prisma.courseReview.create({ data: { courseId: courseB, userId: paidIds[1], rating: 2, comment: 'Chưa hài lòng', createdAt: daysAgo(2) } });
    // Loại chủ khoá: câu hỏi + đánh giá 1★ của chính alice không được tính; 1 khoá draft bị từ chối gần nhất.
    await prisma.courseQuestion.create({ data: { courseId: courseB, userId: alice.id, body: 'Câu hỏi của chủ khoá', createdAt: daysAgo(6) } });
    await prisma.courseReview.create({ data: { courseId: courseB, userId: alice.id, rating: 1, comment: 'Chủ khoá tự chấm', createdAt: daysAgo(1) } });
    const rejected = await prisma.course.create({
      data: { instructorId: alice.id, priceAmount: 0, title: REJECTED_TITLE, slug: `e2e-rejected-${randomUUID()}`, status: 'draft' },
      select: { id: true },
    });
    await prisma.courseApproval.create({ data: { courseId: rejected.id, submittedById: alice.id, status: 'rejected', reason: 'e2e' } });
  }, SLOW);

  // course cascade → item/enrollment/progress/segments; asset Restrict theo owner → xoá trước user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.order.deleteMany({ where: { userId: { in: buyerIds } } });
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  it('[engagement] số liệu hành vi học của khoá, loại chủ khoá', async () => {
    const b = (await get(`${A}/courses/${courseA}/engagement`, alice.cookie).expect(200)).body;
    expect(b.enrolled).toBe(25);
    expect(b.kpis.active7d).toBe(25);
    expect(b.kpis.watchMin30d).toBe(118); // round((20·300 + 5·150 + 8·40) / 60)
    expect(b.weekly).toHaveLength(12);
    expect(b.weekly[11].current).toBe(true);
    expect(b.progress.n).toBe(25);
    expect(b.progress.items[0].completed).toBe(0.8);
    expect(b.progress.items[1].completed).toBe(0.2);
    expect(b.progress.bottleneck).toEqual({ itemId: item2, completed: 0.2, drop: 0.6 });
    expect(b.lectures[0]).toEqual(expect.objectContaining({ itemId: item1, viewers: 25, peaks: 1, drop: expect.objectContaining({ toSec: 150 }) }));
    expect(b.defaultLecture.itemId).toBe(item1);
    expect(b.defaultLecture.peaks[0].people).toBe(8);
  }, SLOW);

  it('[engagement] đường giữ chân của một bài', async () => {
    const b = (await get(`${A}/lectures/${item1}/retention`, alice.cookie).expect(200)).body;
    expect(b.n).toBe(25);
    expect(b.enrolled).toBe(25);
    expect(b.points).toHaveLength(60);
    expect(b.points[0].retention).toBe(1);
  }, SLOW);

  it('[engagement] giảng viên khác, id sai, bài không phải video → 404', async () => {
    await get(`${A}/courses/${courseA}/engagement`, bob.cookie).expect(404);
    await get(`${A}/lectures/${item1}/retention`, bob.cookie).expect(404);
    await get(`${A}/lectures/abc/retention`, alice.cookie).expect(404);
    await get(`${A}/lectures/${quizItem}/retention`, alice.cookie).expect(404);
  }, SLOW);

  it('[revenue] doanh thu 30 ngày: tổng, khoá, chuyển đổi', async () => {
    const b = (await get(`${A}/revenue?range=30d`, alice.cookie).expect(200)).body;
    expect(b.verified).toBe(true);
    expect(b.canSell).toBe(true);
    expect(b.series).toHaveLength(30);
    expect(b.totals).toEqual({ earned: 1393000, gross: 1990000, sales: 10 });
    expect(b.courses[0]).toEqual(expect.objectContaining({ courseId: courseB, earned: 1393000, sales: 10, newEnrollments: 10, visitors: 72, conversion: Math.round((10 / 72) * 1000) / 1000 }));
    expect(b.courses.find((c: { courseId: string }) => c.courseId === courseA)).toEqual(expect.objectContaining({ earned: 0, visitors: 0, conversion: null }));
  }, SLOW);

  it('[revenue] doanh thu 12 tháng', async () => {
    const b = (await get(`${A}/revenue?range=12m`, alice.cookie).expect(200)).body;
    expect(b.series).toHaveLength(12);
    expect(b.series[10].earned + b.series[11].earned).toBe(1393000);
  }, SLOW);

  it('[funnel] phễu khoá có phí / miễn phí, tham số sai → 400', async () => {
    const b = (await get(`${A}/courses/${courseB}/funnel?days=30`, alice.cookie).expect(200)).body;
    expect(b.isFree).toBe(false);
    expect(b.steps.map((s: { people: number }) => s.people)).toEqual([72, 12, 12, 10]);
    expect(b.weakest.key).toBe('cart');
    expect(b.trackedSince).not.toBeNull();
    await get(`${A}/courses/${courseB}/funnel?days=5`, alice.cookie).expect(400);
    const a = (await get(`${A}/courses/${courseA}/funnel`, alice.cookie).expect(200)).body;
    expect(a.isFree).toBe(true);
    expect(a.steps).toHaveLength(2);
  }, SLOW);

  it('[revenue] giảng viên khác → 404 / không có dữ liệu', async () => {
    await get(`${A}/courses/${courseB}/funnel`, bob.cookie).expect(404);
    const b = (await get(`${A}/revenue`, bob.cookie).expect(200)).body;
    expect(b).toEqual(expect.objectContaining({ verified: false, canSell: false, courses: [] }));
  }, SLOW);

  it('[overview] tổng quan: KPI, việc cần làm, đánh giá thấp', async () => {
    const b = (await get(`${A}/overview`, alice.cookie).expect(200)).body;
    expect(b).toEqual(expect.objectContaining({ name: 'Alice Nguyễn', canSell: true }));
    expect(b.kpis).toEqual(expect.objectContaining({ reviewCount: 1, rating: 2, enrollments30d: 10, active7d: 25 }));
    expect(b.todo.unansweredQuestions).toEqual({ count: 1, oldestDays: 4 });
    expect(b.todo).toEqual(expect.objectContaining({ lowReviews: 1, unreadMessages: 0 }));
    expect(b.todo.rejectedCourses).toEqual({ count: 1, firstTitle: REJECTED_TITLE });
    expect(b.revenue12m).toHaveLength(12);
    expect(b.reviews.distribution).toContainEqual({ stars: 2, count: 1 });
    expect(b.reviews.distribution).toContainEqual({ stars: 1, count: 0 });
    expect(b.reviews.low.some((r: { userId: string }) => r.userId === alice.id)).toBe(false);
    expect(b.reviews.low[0].canMessage).toBe(true);
  }, SLOW);

  it('[overview] giảng viên chưa có khoá → số 0, danh sách rỗng', async () => {
    const b = (await get(`${A}/overview`, bob.cookie).expect(200)).body;
    expect(b).toEqual(expect.objectContaining({ verified: false, canSell: false, atRisk: [] }));
    expect(b.kpis).toEqual({ earnedMonth: 0, earnedPrevMonth: 0, enrollments30d: 0, enrollmentsPrev30d: 0, active7d: 0, active7dPrev: 0, rating: null, reviewCount: 0 });
  }, SLOW);
});
