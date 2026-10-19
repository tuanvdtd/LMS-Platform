import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';
import { isPrivatePath } from '@/lib/private-routes';
import { safeRedirect } from '@/lib/safe-redirect';

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

// Chỉ kiểm tra có cookie (lạc quan, không gọi back-end). Cookie hỏng → API trả 401, interceptor
// lib/api/client.ts đưa về /login?redirect=. Prod cần COOKIE_DOMAIN để FE đọc được cookie do back-end set.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = !!getSessionCookie(request);

  // Không có /reset-password: user đang đăng nhập vẫn bấm được link đặt lại
  if (signedIn && AUTH_PAGES.includes(pathname)) {
    const to = safeRedirect(request.nextUrl.searchParams.get('redirect'));
    return NextResponse.redirect(new URL(to, request.url));
  }
  // Trang chủ thành viên ở /home: rewrite (giữ URL '/') để trang '/' của khách không phải đọc cookie, render tĩnh.
  if (signedIn && pathname === '/') return NextResponse.rewrite(new URL('/home', request.url));
  if (!signedIn && isPrivatePath(pathname)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', safeRedirect(pathname + search));
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Literal (Next bỏ qua biến). Rộng: mọi trang trừ _next, tunnel Sentry (/monitoring) và file tĩnh theo đuôi;
// không loại mọi path có dấu chấm để slug kiểu "node.js-basics" vẫn được chặn.
export const config = {
  matcher: ['/((?!_next|monitoring|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|xml|webmanifest)$).*)'],
};
