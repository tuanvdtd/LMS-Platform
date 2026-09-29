import { z } from 'zod';
import { passwordField } from '../../_components/auth-fields.schema.ts';

export const resetPasswordSchema = z
  .object({ password: passwordField, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;
