import type { Metadata } from 'next';
import { ResetPasswordForm } from './_components/reset-password-form';

// Token nằm trên URL → không gửi Referer ra ngoài
export const metadata: Metadata = { title: 'Đặt lại mật khẩu | SkillPath', referrer: 'no-referrer' };

// Back-end redirect về đây kèm ?token=... hoặc ?error=INVALID_TOKEN
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token, error } = await searchParams;
  const t = typeof token === 'string' && !error ? token : null;
  return <ResetPasswordForm token={t} />;
}
