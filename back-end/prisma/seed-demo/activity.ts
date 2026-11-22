import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient, SubmissionStatus } from '@prisma/client';
import { splitRevenue } from '../../src/revenue/split-revenue.ts';
import { REPLY_TEMPLATES, REVIEW_TEMPLATES } from './data/reviews.ts';
import type { CourseLevel, Lang } from './data/types.ts';
import {
  defaultParam, GENERIC_BUGS, simulateExercise, simulateQuiz,
  type ItemParam, type SimAttempt, type SimExercise, type SimQuiz, type SimSubmission,
} from './assessment-sim.ts';
import { DAY, HOUR, addMs, between, chance, int, maxDate, minDate, pick, weighted, type Rng } from './rng.ts';

export type PUser = { id: string; createdAt: Date; topicIds: string[] };
export type PCourse = {
  id: string; instructorId: string; publishedAt: Date; priceAmount: number; level: CourseLevel; language: Lang;
  label: string; lectureTitles: string[]; topicIds: string[]; items: { id: string; durationSec: number }[];
  quiz?: (SimQuiz & { itemId: string }) | null; exercise?: (SimExercise & { itemId: string }) | null;
};

// Cùng công thức src/curriculum/progress.ts: item published đã xong / tổng item published.
export const progressPct = (done: number, total: number) => (total ? Math.round((done / total) * 10_000) / 100 : 0);

// Mô phỏng lượt quiz / bài nộp cho item quiz, bài code đã hoàn thành (luồng rng riêng để không xáo dữ liệu cũ).
// params: tham số IRT riêng theo khoá (khoá trình diễn có câu lỗi cài sẵn); khoá khác dùng defaultParam.
export type ActivitySim = { rng: Rng; id: () => string; theta: (userId: string) => number; params?: Map<string, ItemParam[]> };

export function planActivity(input: { users: PUser[]; courses: PCourse[]; sharePct: number; now: Date }, rng: Rng, sim?: ActivitySim) {
  const { users, courses, sharePct, now } = input;
  const latest = addMs(now, -HOUR);
  // Khoá cho người mới và may rủi → vài khoá đông, vài khoá ngách ít người.
  const popularity = new Map(courses.map((c) => [c.id, (c.level === 'beginner' ? 1.6 : 1) * (0.6 + rng() * 1.4)]));
  const pairs: { user: PUser; course: PCourse }[] = [];

  for (const user of users) {
    const pool = courses.filter((c) => c.instructorId !== user.id && c.publishedAt < addMs(now, -DAY));
    const k = Math.min(int(rng, 3, 8), pool.length);
    const remaining = [...pool];
    for (let i = 0; i < k; i++) {
      const c = weighted(rng, remaining.map((x) => [x, popularity.get(x.id)! * (x.topicIds.some((t) => user.topicIds.includes(t)) ? 5 : 1)] as const));
      remaining.splice(remaining.indexOf(c), 1);
      pairs.push({ user, course: c });
    }
  }
  for (const c of courses) {
    if (pairs.some((p) => p.course === c)) continue;
    const candidates = users.filter((u) => u.id !== c.instructorId);
    pairs.push({ user: pick(rng, candidates), course: c });
  }

  const enrollments = pairs.map(({ user, course }) => ({
    id: uuidv7(), userId: user.id, courseId: course.id, course,
    at: between(rng, addMs(maxDate(user.createdAt, course.publishedAt), HOUR), latest),
    orderId: null as string | null, progressPct: 0, completedAt: null as Date | null,
    lastItemId: null as string | null, lastAccessedAt: null as Date | null,
  }));

  // Đơn hàng: ~20% đơn gộp 2 khoá có phí mua cùng lúc.
  const orders: { id: string; userId: string; totalAmount: number; providerSessionId: string; paidAt: Date }[] = [];
  const orderItems: { orderId: string; courseId: string; instructorId: string; listPriceAmount: number; unitPriceAmount: number; instructorEarnAmount: number; platformFeeAmount: number }[] = [];
  for (const user of users) {
    const paid = enrollments.filter((e) => e.userId === user.id && e.course.priceAmount > 0).sort((a, b) => a.at.getTime() - b.at.getTime());
    for (let i = 0; i < paid.length; i++) {
      const group = [paid[i]];
      if (i + 1 < paid.length && chance(rng, 0.2)) group.push(paid[++i]);
      const paidAt = maxDate(...group.map((e) => e.at));
      const orderId = uuidv7();
      for (const e of group) {
        e.at = paidAt;
        e.orderId = orderId;
        orderItems.push({
          orderId, courseId: e.courseId, instructorId: e.course.instructorId, listPriceAmount: e.course.priceAmount,
          unitPriceAmount: e.course.priceAmount, ...splitRevenue(e.course.priceAmount, sharePct),
        });
      }
      orders.push({ id: orderId, userId: user.id, totalAmount: group.reduce((s, e) => s + e.course.priceAmount, 0), providerSessionId: `cs_seed_${uuidv7()}`, paidAt });
    }
  }

  // Tiến độ: 25% học xong, 50% học dở, 25% chưa học; học theo đúng thứ tự item.
  const progress: { enrollmentId: string; itemId: string; durationSec: number; completedAt: Date }[] = [];
  const attempts: SimAttempt[] = [];
  const submissions: SimSubmission[] = [];
  for (const e of enrollments) {
    const n = e.course.items.length;
    const state = weighted(rng, [['done', 25], ['partial', 50], ['none', 25]] as const);
    const target = state === 'done' ? n : state === 'partial' && n > 1 ? int(rng, 1, n - 1) : 0;
    let t = e.at;
    let done = 0;
    for (const item of e.course.items.slice(0, target)) {
      const next = addMs(t, (0.3 + rng() * 2.7) * DAY);
      if (next > latest) break;
      let doneAt: Date | null = next;
      const quiz = e.course.quiz;
      const exercise = e.course.exercise;
      if (sim && quiz && item.id === quiz.itemId) {
        const p = sim.params?.get(e.courseId);
        const r = simulateQuiz(sim.rng, {
          quiz, param: p ? (i) => p[i] : defaultParam, userId: e.userId, theta: sim.theta(e.userId),
          from: t, to: next, run: { maxAttempts: 3, retake: 1, mustPass: true }, id: sim.id,
        });
        attempts.push(...r.attempts);
        doneAt = r.passedAt;
      } else if (sim && exercise && item.id === exercise.itemId) {
        const r = simulateExercise(sim.rng, {
          exercise, bugs: GENERIC_BUGS, b: 0, userId: e.userId, theta: sim.theta(e.userId),
          from: t, to: next, run: { maxSubmissions: 3, mustPass: true }, id: sim.id,
        });
        submissions.push(...r.submissions);
        doneAt = r.acceptedAt;
      }
      if (!doneAt) break; // không đạt được thì dừng ở item này, không đánh dấu hoàn thành
      t = doneAt;
      progress.push({ enrollmentId: e.id, itemId: item.id, durationSec: item.durationSec, completedAt: t });
      e.lastItemId = item.id;
      done++;
    }
    e.progressPct = progressPct(done, n);
    e.completedAt = n > 0 && done === n ? t : null;
    e.lastAccessedAt = done ? t : e.at;
  }

  // Đánh giá: 35–40% lượt có tiến độ ≥ 50% (đúng ngưỡng học viên được đánh giá); sao lệch về 4–5.
  const reviews: { courseId: string; userId: string; rating: number; comment: string; createdAt: Date; instructorReply: string | null; instructorRepliedAt: Date | null }[] = [];
  for (const e of enrollments) {
    if (e.progressPct < 50 || !chance(rng, 0.375)) continue;
    const rating = weighted(rng, [[5, 50], [4, 35], [3, 12], [2, 3]] as const);
    const fill = (s: string) => s.replaceAll('{tech}', e.course.label).replaceAll('{lecture}', pick(rng, e.course.lectureTitles));
    const createdAt = between(rng, e.lastAccessedAt!, minDate(latest, addMs(e.lastAccessedAt!, 14 * DAY)));
    const reply = chance(rng, 0.3);
    reviews.push({
      courseId: e.courseId, userId: e.userId, rating, comment: fill(pick(rng, REVIEW_TEMPLATES[e.course.language][rating])), createdAt,
      // Đánh giá 4–5★ nhận lời cảm ơn; 2–3★ nhận câu nói sẽ sửa gì, để lời hứa khớp với góp ý.
      instructorReply: reply ? fill(pick(rng, REPLY_TEMPLATES[e.course.language][rating >= 4 ? 'positive' : 'critical'])) : null,
      instructorRepliedAt: reply ? between(rng, addMs(createdAt, HOUR), minDate(latest, addMs(createdAt, 5 * DAY))) : null,
    });
  }

  return { enrollments, orders, orderItems, progress, reviews, attempts, submissions };
}

export type ActivityPlan = ReturnType<typeof planActivity>;

export type ActivityRows = {
  orders: ActivityPlan['orders'];
  orderItems: ActivityPlan['orderItems'];
  enrollments: {
    id: string; userId: string; courseId: string; orderId: string | null; progressPct: number;
    completedAt: Date | null; lastAccessedAt: Date | null; lastItemId: string | null; at: Date;
  }[];
  progress: ActivityPlan['progress'];
  reviews: ActivityPlan['reviews'];
  attempts: SimAttempt[];
  submissions: SimSubmission[];
};

export async function writeActivity(prisma: PrismaClient, plan: ActivityRows) {
  await prisma.$transaction(async (tx) => {
    await tx.order.createMany({ data: plan.orders.map((o) => ({
      id: o.id, userId: o.userId, status: 'paid', subtotalAmount: o.totalAmount, discountAmount: 0, totalAmount: o.totalAmount,
      provider: 'stripe', providerSessionId: o.providerSessionId, paidAt: o.paidAt, createdAt: o.paidAt, updatedAt: o.paidAt,
    })) });
    await tx.orderItem.createMany({ data: plan.orderItems });
    await tx.enrollment.createMany({ data: plan.enrollments.map((e) => ({
      id: e.id, userId: e.userId, courseId: e.courseId, orderId: e.orderId, progressPct: e.progressPct, completedAt: e.completedAt,
      lastAccessedAt: e.lastAccessedAt, lastItemId: e.lastItemId, createdAt: e.at,
    })) });
    await tx.itemProgress.createMany({ data: plan.progress.map((p) => ({
      enrollmentId: p.enrollmentId, itemId: p.itemId, lastPositionSec: p.durationSec,
      completedAt: p.completedAt, createdAt: p.completedAt,
    })) });
    await tx.courseReview.createMany({ data: plan.reviews.map((r) => ({ ...r, updatedAt: r.instructorRepliedAt ?? r.createdAt })) });
    await tx.quizAttempt.createMany({
      data: plan.attempts.map((a) => ({
        id: a.id, quizId: a.quizId, userId: a.userId, attemptNo: a.attemptNo, status: 'submitted' as const, startedAt: a.startedAt,
        submittedAt: a.submittedAt, scorePct: a.scorePct, passed: a.passed, timeSpentSec: a.timeSpentSec, questionIds: a.questionIds,
        passScorePct: a.passScorePct, shuffle: false,
      })),
    });
    await tx.quizAnswer.createMany({ data: plan.attempts.flatMap((a) => a.answers.map((x) => ({ attemptId: a.id, ...x }))) });
    await tx.submission.createMany({
      data: plan.submissions.map((s) => ({
        id: s.id, exerciseId: s.exerciseId, userId: s.userId, language: s.language, sourceCode: s.sourceCode,
        status: s.status as SubmissionStatus, score: s.score, passedTests: s.passedTests, totalTests: s.totalTests,
        maxTimeMs: s.maxTimeMs, maxMemoryKb: s.maxMemoryKb, submittedAt: s.submittedAt, gradedAt: s.gradedAt,
      })),
    });
    await tx.submissionResult.createMany({
      data: plan.submissions.flatMap((s) => s.results.map((r) => ({ submissionId: s.id, ...r, status: r.status as SubmissionStatus }))),
    });
  }, { timeout: 120_000 });
}
