import { ViewTransition } from 'react';

// Trang trượt ngang khi link mang transitionTypes: 'nav-forward' (trang mới vào từ phải) / 'nav-back' (vào từ trái).
// Điều hướng khác (nút Back trình duyệt, router.push, tải dữ liệu) không có type → đứng yên. CSS ở globals.css.
// Đặt trong page.tsx/loading.tsx, không đặt ở layout: layout không remount nên enter/exit không chạy.
const DIRECTION = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' };

export function PageSlide({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={DIRECTION} exit={DIRECTION} default="none">
      {children}
    </ViewTransition>
  );
}
