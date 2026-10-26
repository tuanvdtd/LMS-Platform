import { create } from 'zustand';

// Số khoá trong giỏ cho badge ở header. Giỏ thật nằm ở BE: chỗ nào vừa biết số mới (tải giỏ, thêm khoá) thì ghi vào đây.
// Đăng xuất tải lại toàn trang (use-sign-out.ts) nên store tự về 0, không lộ số của tài khoản trước.
export const useCartCount = create(() => ({ count: 0 }));
