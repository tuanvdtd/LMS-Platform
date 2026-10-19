// Trang cần đăng nhập (spec guest-ui §4.1). Dùng chung cho proxy.ts (chặn khách) và useSignOut (trang đích).
// File thuần, không import alias → test bằng node:test.
export const PRIVATE_PREFIXES = [
  '/my-learning', '/cart', '/orders', '/settings', '/skills', '/certificates', '/notifications',
  '/messages', '/learn', '/onboarding', '/checkout', '/instructor', '/admin', '/home',
] as const;

// Khớp theo đoạn: '/learn' khớp '/learn/x' nhưng không khớp '/learning-x'.
export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}
