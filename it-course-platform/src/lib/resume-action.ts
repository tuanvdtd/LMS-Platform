// Hành động khách bấm dở ở trang khoá học, chạy lại sau khi đăng nhập (spec guest-ui §4.5).
// File thuần, không import alias → test bằng node:test.
export type ResumeAction = 'add-to-cart' | 'enroll' | 'buy-now';
const ACTIONS: readonly string[] = ['add-to-cart', 'enroll', 'buy-now'];

export function parseAction(value: string | null): ResumeAction | null {
  return value && ACTIONS.includes(value) ? (value as ResumeAction) : null;
}

// Giữ couponCode và query khác để sau đăng nhập giá/coupon vẫn đúng.
export function loginUrlFor(pathname: string, search: string, action: ResumeAction): string {
  const params = new URLSearchParams(search);
  params.set('action', action);
  return `/login?redirect=${encodeURIComponent(`${pathname}?${params}`)}`;
}

export function withoutAction(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete('action');
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
