// Hành động khách bấm dở (trang khoá học, nút tim bài viết), chạy lại sau khi đăng nhập.
// File thuần, không import alias → test bằng node:test.
export type ResumeAction = 'add-to-cart' | 'enroll' | 'buy-now' | 'like';
const ACTIONS: readonly string[] = ['add-to-cart', 'enroll', 'buy-now', 'like'];

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
