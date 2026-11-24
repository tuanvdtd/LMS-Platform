import { funnel } from '../../src/analytics/funnel.ts';
import { planFunnelEvents } from './funnel-events.ts';
import { mulberry32 } from './rng.ts';

const DAY = 86_400_000;
const now = new Date('2026-11-21T00:00:00Z');
let n = 0;
const id = () => `id${++n}`;
const paid = { id: 'paid', instructorId: 'i', priceAmount: 299_000, publishedAt: new Date(now.getTime() - 200 * DAY) };
const free = { id: 'free', instructorId: 'i', priceAmount: 0, publishedAt: new Date(now.getTime() - 200 * DAY) };
const users = Array.from({ length: 200 }, (_, i) => `u${i}`);
const enrollments = [
  ...users.slice(0, 80).map((userId, i) => ({ userId, courseId: 'paid', at: new Date(now.getTime() - (i + 1) * DAY) })),
  ...users.slice(50, 120).map((userId, i) => ({ userId, courseId: 'free', at: new Date(now.getTime() - (i + 1) * DAY) })),
];
const plan = planFunnelEvents(mulberry32(11), { now, courses: [paid, free], enrollments, userIds: users, sharePct: 70, id });
const ms = (d: Date) => d.getTime();

describe('planFunnelEvents', () => {
  it('mọi người ghi danh có ít nhất một lượt xem trước lúc ghi danh, có lượt kèm userId', () => {
    for (const e of enrollments) {
      const views = plan.events.filter((x) => x.courseId === e.courseId && x.kind === 'page_view' && (x.userId === e.userId || x.visitorId === plan.visitorOf.get(e.userId)));
      expect(views.length).toBeGreaterThanOrEqual(1);
      expect(views.some((v) => v.userId === e.userId)).toBe(true);
      expect(views.every((v) => ms(v.createdAt) <= ms(e.at))).toBe(true);
    }
  });
  it('khoá free không có cart_add / đơn failed; mốc thời gian ≤ hiện tại', () => {
    expect(plan.events.some((x) => x.courseId === 'free' && x.kind === 'cart_add')).toBe(false);
    expect(plan.failed.every((o) => o.item.courseId === 'paid')).toBe(true);
    expect(plan.events.every((x) => ms(x.createdAt) <= ms(now))).toBe(true);
  });
  it('tỉ lệ chuyển đổi khoá có phí trong khoảng 2–10%, phễu không tăng', () => {
    const f = funnel({
      isFree: false,
      events: plan.events.filter((x) => x.courseId === 'paid').map((x) => ({ ...x, at: ms(x.createdAt) })),
      checkouts: [...enrollments.filter((e) => e.courseId === 'paid').map((e) => e.userId), ...plan.failed.map((o) => o.userId)],
      enrollments: enrollments.filter((e) => e.courseId === 'paid').map((e) => e.userId),
    });
    const ppl = f.steps.map((s) => s.people);
    for (let i = 1; i < ppl.length; i++) expect(ppl[i]).toBeLessThanOrEqual(ppl[i - 1]);
    const conv = ppl.at(-1)! / ppl[0];
    expect(conv).toBeGreaterThan(0.02);
    expect(conv).toBeLessThan(0.1);
  });
});
