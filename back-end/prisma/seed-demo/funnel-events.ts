import type { PrismaClient } from '@prisma/client';
import { splitRevenue } from '../../src/revenue/split-revenue.ts';
import { DAY, HOUR, addMs, between, chance, int, maxDate, minDate, pick, type Rng } from './rng.ts';

// Sự kiện phễu cho mọi khoá seed đã xuất bản, khớp ghi danh: người ghi danh có 1–3 lượt xem trong 14 ngày trước đó (một phần xem
// ẩn danh trước rồi đăng nhập — cùng mã khách), khoá có phí ~70% người mua có thêm giỏ (còn lại Mua ngay); thêm người chỉ xem
// (chuyển đổi ~3–8% khoá có phí, ~15–30% khoá free), một phần là tài khoản seed chưa ghi danh có thêm giỏ / đơn failed (bỏ ngang
// ở Stripe). Luồng rng riêng.

const MIN = 60_000;
export type EventRow = {
  id: string; courseId: string; kind: 'page_view' | 'cart_add'; userId: string | null; visitorId: string | null; createdAt: Date;
};
export type FailedOrder = {
  id: string; userId: string; totalAmount: number; providerSessionId: string; createdAt: Date;
  item: { courseId: string; instructorId: string; listPriceAmount: number; unitPriceAmount: number; instructorEarnAmount: number; platformFeeAmount: number };
};

export function planFunnelEvents(
  rng: Rng,
  a: {
    now: Date;
    courses: readonly { id: string; instructorId: string; priceAmount: number; publishedAt: Date }[];
    enrollments: readonly { userId: string; courseId: string; at: Date }[];
    userIds: readonly string[];
    sharePct: number;
    id: () => string;
  },
) {
  const latest = addMs(a.now, -HOUR);
  const visitorOf = new Map<string, string>();
  const vid = (userId: string) => {
    let v = visitorOf.get(userId);
    if (!v) visitorOf.set(userId, (v = a.id()));
    return v;
  };
  const events: EventRow[] = [];
  const failed: FailedOrder[] = [];
  const view = (courseId: string, userId: string | null, visitorId: string, createdAt: Date) =>
    events.push({ id: a.id(), courseId, kind: 'page_view', userId, visitorId, createdAt });

  for (const c of a.courses) {
    const isPaid = c.priceAmount > 0;
    const enr = a.enrollments.filter((e) => e.courseId === c.id);
    const enrolled = new Set(enr.map((e) => e.userId));
    for (const e of enr) {
      const from = maxDate(c.publishedAt, addMs(e.at, -14 * DAY));
      const k = int(rng, 1, 3);
      const times = Array.from({ length: k }, () => between(rng, from, e.at)).sort((x, y) => x.getTime() - y.getTime());
      const anonFirst = k > 1 && chance(rng, 0.35);
      times.forEach((t, i) => view(c.id, anonFirst && i === 0 ? null : e.userId, vid(e.userId), t));
      if (isPaid && chance(rng, 0.7)) {
        events.push({ id: a.id(), courseId: c.id, kind: 'cart_add', userId: e.userId, visitorId: null, createdAt: between(rng, times.at(-1)!, e.at) });
      }
    }
    const conv = isPaid ? 0.03 + rng() * 0.05 : 0.15 + rng() * 0.15;
    const extra = Math.min(3000, Math.round(enr.length * (1 / conv - 1)));
    const outsiders = a.userIds.filter((u) => !enrolled.has(u) && u !== c.instructorId);
    for (let i = 0; i < extra; i++) {
      const t = between(rng, c.publishedAt, latest);
      const userId = outsiders.length && chance(rng, 0.1) ? pick(rng, outsiders) : null;
      const visitorId = userId ? vid(userId) : a.id();
      view(c.id, userId, visitorId, t);
      if (chance(rng, 0.3)) view(c.id, userId, visitorId, between(rng, t, minDate(latest, addMs(t, 3 * DAY))));
      if (!isPaid || !userId) continue;
      if (chance(rng, 0.3)) events.push({ id: a.id(), courseId: c.id, kind: 'cart_add', userId, visitorId: null, createdAt: minDate(latest, addMs(t, int(rng, 1, 30) * MIN)) });
      if (chance(rng, 0.15)) {
        failed.push({
          id: a.id(), userId, totalAmount: c.priceAmount, providerSessionId: `cs_seed_${a.id()}`, createdAt: minDate(latest, addMs(t, int(rng, 31, 90) * MIN)),
          item: { courseId: c.id, instructorId: c.instructorId, listPriceAmount: c.priceAmount, unitPriceAmount: c.priceAmount, ...splitRevenue(c.priceAmount, a.sharePct) },
        });
      }
    }
  }
  return { events, failed, visitorOf };
}

export async function writeFunnelEvents(prisma: PrismaClient, plan: ReturnType<typeof planFunnelEvents>) {
  await prisma.order.createMany({
    data: plan.failed.map((o) => ({
      id: o.id, userId: o.userId, status: 'failed' as const, subtotalAmount: o.totalAmount, discountAmount: 0, totalAmount: o.totalAmount,
      provider: 'stripe' as const, providerSessionId: o.providerSessionId, createdAt: o.createdAt, updatedAt: o.createdAt,
    })),
  });
  await prisma.orderItem.createMany({ data: plan.failed.map((o) => ({ orderId: o.id, ...o.item })) });
  for (let i = 0; i < plan.events.length; i += 5000) {
    await prisma.courseEvent.createMany({ data: plan.events.slice(i, i + 5000) });
  }
}
