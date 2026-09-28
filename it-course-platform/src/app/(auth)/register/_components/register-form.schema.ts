import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(50, 'Họ tên tối đa 50 ký tự'),
    // trim/lowercase trước rồi mới kiểm định dạng, để " A@B.com " vẫn hợp lệ
    email: z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ')),
    // 8–128 = mặc định minPasswordLength/maxPasswordLength của Better Auth
    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(128, 'Mật khẩu tối đa 128 ký tự'),
    confirmPassword: z.string(),
    // boolean + refine (không dùng z.literal(true)) để defaultValues false vẫn đúng type
    acceptTerms: z.boolean().refine((v) => v, 'Bạn cần đồng ý với điều khoản'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
