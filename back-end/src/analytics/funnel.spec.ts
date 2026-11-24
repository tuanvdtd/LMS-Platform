import { funnel, type FunnelInput } from './funnel.js';

const view = (visitorId: string | null, userId: string | null = null, at = 1) => ({ kind: 'page_view' as const, visitorId, userId, at });
const cart = (userId: string, at = 2) => ({ kind: 'cart_add' as const, visitorId: null, userId, at });
const base: FunnelInput = { isFree: false, events: [], checkouts: [], enrollments: [] };

describe('funnel', () => {
  it('đếm theo người, mỗi bước gồm người đạt bước đó hoặc bước sau', () => {
    const r = funnel({
      ...base,
      events: [view('v1'), view('v1'), view('v2'), view('v3', 'u3'), cart('u3'), view('v4', 'u4')],
      checkouts: ['u4', 'u5'], // u4 Mua ngay (không qua giỏ); u5 không có lượt xem ghi lại
      enrollments: ['u4'],
    });
    expect(r.steps).toEqual([
      { key: 'view', people: 5 }, // v1, v2, u3, u4, u5
      { key: 'cart', people: 3 }, // u3, u4, u5
      { key: 'checkout', people: 2 },
      { key: 'enroll', people: 1 },
    ]);
  });
  it('gộp mã khách về userId gần nhất từng đi kèm (xem ẩn danh rồi đăng nhập)', () => {
    const r = funnel({ ...base, events: [view('v1', null, 1), view('v1', 'old', 2), view('v1', 'u1', 3), cart('u1', 4)] });
    expect(r.steps[0].people).toBe(2); // 'old' và u1 (lượt ẩn danh gộp về u1)
    expect(r.steps[1].people).toBe(1);
  });
  it('links ngoài cửa sổ: mã khách đã từng đăng nhập vẫn gộp về userId', () => {
    const r = funnel({ ...base, events: [view('v9')], links: [{ visitorId: 'v9', userId: 'u9' }], enrollments: ['u9'] });
    expect(r.steps.map((s) => s.people)).toEqual([1, 1, 1, 1]);
  });
  it('ghi danh bằng mã miễn phí (không qua đơn) vẫn tới bước cuối', () => {
    const r = funnel({ ...base, events: [view(null, 'u1')], enrollments: ['u1'] });
    expect(r.steps.map((s) => s.people)).toEqual([1, 1, 1, 1]);
  });
  it('khoá free: 2 bước, bỏ qua cart_add', () => {
    const r = funnel({ isFree: true, events: [view('v1'), view('v2', 'u2'), cart('u9')], checkouts: [], enrollments: ['u2'] });
    expect(r.steps).toEqual([{ key: 'view', people: 2 }, { key: 'enroll', people: 1 }]);
  });
  it('weakest chỉ có khi ≥ 50 người xem; là bước giữ lại thấp nhất', () => {
    const events = Array.from({ length: 60 }, (_, i) => view(`v${i}`));
    const r = funnel({ ...base, events: [...events, cart('a'), cart('b'), cart('c')], checkouts: ['a', 'b', 'c'], enrollments: ['a'] });
    expect(r.steps.map((s) => s.people)).toEqual([63, 3, 3, 1]);
    expect(r.weakest?.key).toBe('cart');
    expect(r.weakest?.rate).toBeCloseTo(3 / 63);
    expect(funnel({ ...base, events: events.slice(0, 10) }).weakest).toBeNull();
  });
  it('không có dữ liệu → mọi bước 0, weakest null', () => {
    expect(funnel(base)).toEqual({ steps: ['view', 'cart', 'checkout', 'enroll'].map((key) => ({ key, people: 0 })), weakest: null });
  });
});
