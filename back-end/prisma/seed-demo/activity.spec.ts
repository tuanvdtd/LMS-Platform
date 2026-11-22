import { planActivity, progressPct } from './activity.ts';
import { mulberry32, DAY } from './rng.ts';
import { splitRevenue } from '../../src/revenue/split-revenue.ts';

const now = new Date('2026-11-02T00:00:00Z');
const ago = (d: number) => new Date(now.getTime() - d * DAY);
const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, durationSec: 300 }));
const course = (id: string, price: number, topic: string) => ({
  id, instructorId: 'teacher', publishedAt: ago(200), priceAmount: price, level: 'beginner' as const, language: 'vi' as const,
  label: 'React', lectureTitles: ['Bài A', 'Bài B'], topicIds: [topic], items: items(6),
});
const users = Array.from({ length: 30 }, (_, i) => ({ id: `u${i}`, createdAt: ago(250), topicIds: ['t1'] }));
const courses = [course('c1', 499_000, 't1'), course('c2', 0, 't1'), course('c3', 299_000, 't2'), course('c4', 0, 't9')];

describe('planActivity', () => {
  const plan = planActivity({ users, courses, sharePct: 70, now }, mulberry32(5));

  it('mỗi user 3–4 khoá (chỉ có 4 khoá), không ghi danh khoá của mình, mỗi khoá ≥ 1 học viên', () => {
    for (const u of users) {
      const n = plan.enrollments.filter((e) => e.userId === u.id).length;
      expect(n).toBeGreaterThanOrEqual(3);
    }
    for (const c of courses) expect(plan.enrollments.some((e) => e.courseId === c.id)).toBe(true);
  });
  it('ghi danh sau publish và sau ngày user tham gia, trước now', () => {
    for (const e of plan.enrollments) {
      expect(e.at.getTime()).toBeGreaterThan(ago(200).getTime());
      expect(e.at.getTime()).toBeLessThan(now.getTime());
    }
  });
  it('khoá có phí có đơn paid, item chia tiền đúng splitRevenue; khoá free không có đơn', () => {
    for (const e of plan.enrollments) {
      const c = courses.find((x) => x.id === e.courseId)!;
      if (c.priceAmount === 0) expect(e.orderId).toBeNull();
      else expect(plan.orders.find((o) => o.id === e.orderId)).toBeTruthy();
    }
    for (const it of plan.orderItems) {
      expect(it).toMatchObject(splitRevenue(it.unitPriceAmount, 70));
    }
    for (const o of plan.orders) {
      const sum = plan.orderItems.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.unitPriceAmount, 0);
      expect(o.totalAmount).toBe(sum);
    }
  });
  it('progressPct khớp số item đã xong, completedAt chỉ khi xong hết', () => {
    for (const e of plan.enrollments) {
      const done = plan.progress.filter((p) => p.enrollmentId === e.id).length;
      expect(e.progressPct).toBe(progressPct(done, 6));
      expect(!!e.completedAt).toBe(done === 6);
    }
  });
  it('đánh giá chỉ từ lượt có tiến độ ≥ 50, 1 đánh giá mỗi user/khoá, sao 2–5', () => {
    for (const r of plan.reviews) {
      const e = plan.enrollments.find((x) => x.userId === r.userId && x.courseId === r.courseId)!;
      expect(e.progressPct).toBeGreaterThanOrEqual(50);
      expect([2, 3, 4, 5]).toContain(r.rating);
      expect(r.comment).not.toMatch(/\{tech\}|\{lecture\}/);
    }
  });
  it('cùng seed ra cùng kế hoạch', () => {
    const again = planActivity({ users, courses, sharePct: 70, now }, mulberry32(5));
    expect(again.enrollments.map((e) => [e.userId, e.courseId])).toEqual(plan.enrollments.map((e) => [e.userId, e.courseId]));
  });
});

describe('progressPct', () => {
  it('làm tròn 2 chữ số như app', () => {
    expect(progressPct(1, 3)).toBe(33.33);
    expect(progressPct(0, 0)).toBe(0);
  });
});

describe('planActivity + mô phỏng lượt làm', () => {
  const quiz = {
    id: 'quiz', itemId: 'quiz-item', passScorePct: 70,
    questions: [0, 1, 2].map((i) => ({ id: `q${i}`, type: 'single_choice' as const, points: 1, options: [{ id: `q${i}a`, isCorrect: true }, { id: `q${i}b`, isCorrect: false }] })),
  };
  const exercise = { id: 'ex', itemId: 'ex-item', language: 'javascript', starter: 'S', solution: 'X', tests: [0, 1].map((p) => ({ id: `t${p}`, position: p, points: 10 })) };
  const withSim = [{ ...course('c9', 0, 't1'), items: [...items(3), { id: 'quiz-item', durationSec: 0 }, { id: 'ex-item', durationSec: 0 }], quiz, exercise }];
  let n = 0;
  const plan = planActivity({ users, courses: withSim, sharePct: 70, now }, mulberry32(5), { rng: mulberry32(6), id: () => `id${++n}`, theta: () => 0 });
  const userOf = (enrollmentId: string) => plan.enrollments.find((e) => e.id === enrollmentId)!.userId;

  it('quiz hoàn thành ⇔ có lượt đạt đúng lúc hoàn thành, các lượt trước đều trượt', () => {
    const done = plan.progress.filter((p) => p.itemId === 'quiz-item');
    expect(done.length).toBeGreaterThan(0);
    for (const p of done) {
      const mine = plan.attempts.filter((a) => a.userId === userOf(p.enrollmentId)).sort((a, b) => a.attemptNo - b.attemptNo);
      expect(mine.at(-1)).toMatchObject({ passed: true, submittedAt: p.completedAt });
      expect(mine.slice(0, -1).every((a) => !a.passed)).toBe(true);
    }
    const completed = new Set(done.map((p) => userOf(p.enrollmentId)));
    expect(plan.attempts.every((a) => completed.has(a.userId))).toBe(true);
  });
  it('bài code hoàn thành ⇔ bài nộp cuối Accepted đúng lúc hoàn thành', () => {
    for (const p of plan.progress.filter((x) => x.itemId === 'ex-item')) {
      expect(plan.submissions.filter((s) => s.userId === userOf(p.enrollmentId)).at(-1)).toMatchObject({ status: 'accepted', submittedAt: p.completedAt });
    }
  });
  it('không truyền sim thì không sinh lượt làm (giữ hành vi cũ)', () => {
    expect(planActivity({ users, courses: withSim, sharePct: 70, now }, mulberry32(5))).toMatchObject({ attempts: [], submissions: [] });
  });
});
