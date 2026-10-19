// Để URL parser quyết định: nó bỏ tab/xuống dòng nên "/\t/evil.com" thành "//evil.com".
export function safeRedirect(value: string | null | undefined): string {
  if (!value?.startsWith('/')) return '/';
  const base = 'http://n';
  const url = new URL(value, base);
  return url.origin === base ? url.pathname + url.search + url.hash : '/';
}

// Link chéo login ↔ register giữ trang đích; không có đích (hoặc '/') thì để link trơn.
export function withRedirect(path: string, redirect: string | null | undefined): string {
  const to = safeRedirect(redirect);
  return to === '/' ? path : `${path}?redirect=${encodeURIComponent(to)}`;
}
