import { z } from 'zod';

// trim/lowercase trước rồi mới kiểm định dạng, để " A@B.com " vẫn hợp lệ
export const emailField = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'));

// 8–128 = mặc định minPasswordLength/maxPasswordLength của Better Auth
export const passwordField = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự');

export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;
