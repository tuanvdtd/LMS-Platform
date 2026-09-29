// Để URL parser quyết định: nó bỏ tab/xuống dòng nên "/\t/evil.com" thành "//evil.com".
export function safeRedirect(value: string | null | undefined): string {
  if (!value?.startsWith('/')) return '/';
  const base = 'http://n';
  const url = new URL(value, base);
  return url.origin === base ? url.pathname + url.search + url.hash : '/';
}
