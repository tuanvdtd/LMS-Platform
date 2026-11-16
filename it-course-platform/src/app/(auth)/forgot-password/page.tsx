import type { Metadata } from 'next';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export const metadata: Metadata = { title: 'Quên mật khẩu | Aolumi' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
