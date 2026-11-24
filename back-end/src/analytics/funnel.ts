// Phễu chuyển đổi theo NGƯỜI (GA4: view_item → add_to_cart → begin_checkout → purchase). Một người được tính ở bước k nếu đạt
// bước k hoặc bước sau trong cửa sổ → phễu không tăng ("Mua ngay" không qua giỏ vẫn có mặt ở bước giỏ).
// Định danh: userId; lượt xem ẩn danh có mã khách từng đi kèm userId (cùng trình duyệt sau khi đăng nhập) → gộp về userId gần nhất.
// Thuần, không import gì (seed-demo dùng lại).

export const FUNNEL = { minVisitors: 50 } as const;

export type FunnelStepKey = 'view' | 'cart' | 'checkout' | 'enroll';
export type FunnelEvent = { kind: 'page_view' | 'cart_add'; userId: string | null; visitorId: string | null; at: number };
export type FunnelInput = {
  isFree: boolean;
  events: readonly FunnelEvent[];
  checkouts: readonly string[];
  enrollments: readonly string[];
  // Mã khách → userId gần nhất trên toàn bộ dữ liệu khoá (không giới hạn cửa sổ): người đăng nhập trước cửa sổ vẫn được gộp.
  links?: readonly { visitorId: string; userId: string }[];
};
export type FunnelResult = { steps: { key: FunnelStepKey; people: number }[]; weakest: { key: FunnelStepKey; rate: number } | null };

export function funnel(input: FunnelInput): FunnelResult {
  const keys: FunnelStepKey[] = input.isFree ? ['view', 'enroll'] : ['view', 'cart', 'checkout', 'enroll'];
  const reached = new Map<string, number>(); // người → chỉ số bước xa nhất
  const reach = (person: string, key: FunnelStepKey) => {
    const k = keys.indexOf(key);
    if (k >= 0 && (reached.get(person) ?? -1) < k) reached.set(person, k);
  };

  const link = new Map<string, { userId: string; at: number }>();
  for (const l of input.links ?? []) link.set(l.visitorId, { userId: l.userId, at: Number.POSITIVE_INFINITY });
  for (const e of input.events) {
    if (!e.visitorId || !e.userId) continue;
    const cur = link.get(e.visitorId);
    if (!cur || e.at > cur.at) link.set(e.visitorId, { userId: e.userId, at: e.at });
  }
  for (const e of input.events) {
    const userId = e.userId ?? (e.visitorId ? link.get(e.visitorId)?.userId : undefined);
    const person = userId ? `u:${userId}` : e.visitorId ? `v:${e.visitorId}` : null;
    if (person) reach(person, e.kind === 'page_view' ? 'view' : 'cart');
  }
  for (const u of input.checkouts) reach(`u:${u}`, 'checkout');
  for (const u of input.enrollments) reach(`u:${u}`, 'enroll');

  const levels = [...reached.values()];
  const steps = keys.map((key, k) => ({ key, people: levels.filter((x) => x >= k).length }));
  let weakest: FunnelResult['weakest'] = null;
  if (steps[0].people >= FUNNEL.minVisitors) {
    for (let k = 1; k < steps.length; k++) {
      const rate = steps[k - 1].people ? steps[k].people / steps[k - 1].people : 0;
      if (!weakest || rate < weakest.rate) weakest = { key: steps[k].key, rate };
    }
  }
  return { steps, weakest };
}
