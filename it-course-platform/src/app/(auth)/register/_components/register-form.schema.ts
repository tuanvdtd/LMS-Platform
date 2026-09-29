import { z } from 'zod';
import { emailField, passwordField } from '../../_components/auth-fields.schema.ts';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(50, 'Họ tên tối đa 50 ký tự'),
    email: emailField,
    password: passwordField,
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
