import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';
import { safeRedirect } from '@/lib/safe-redirect';

// Chỉ kiểm tra có cookie (lạc quan, không gọi back-end). Cookie hỏng → header
// gọi useSession, back-end xoá cookie, user vào lại /login được.
// Prod cần COOKIE_DOMAIN để FE đọc được cookie do back-end set.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.next();
  const to = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  return NextResponse.redirect(new URL(to, request.url));
}

// Không có /reset-password: user đang đăng nhập vẫn bấm được link đặt lại
export const config = { matcher: ['/login', '/register', '/forgot-password'] };
