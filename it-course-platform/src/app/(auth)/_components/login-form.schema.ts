import { z } from 'zod';
import { emailField } from './auth-fields.schema.ts';

// Không áp 8–128 khi đăng nhập: sai thì luôn là "email hoặc mật khẩu không đúng"
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
