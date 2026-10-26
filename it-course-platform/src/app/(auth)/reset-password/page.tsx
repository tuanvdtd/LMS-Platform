import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthFormSkeleton } from '@/components/skeletons/auth-form-skeleton';
import { ResetPasswordForm } from './_components/reset-password-form';

// Token nằm trên URL → không gửi Referer ra ngoài
export const metadata: Metadata = { title: 'Đặt lại mật khẩu | SkillPath', referrer: 'no-referrer' };

// useSearchParams cần Suspense khi trang được prerender tĩnh, để phần còn lại prerender được
export default function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <ResetPassword searchParams={searchParams} />
    </Suspense>
  );
}

// Back-end redirect về đây kèm ?token=... hoặc ?error=INVALID_TOKEN. invite=1: link mời moderator đặt mật khẩu lần đầu.
async function ResetPassword({ searchParams }: Pick<PageProps<'/reset-password'>, 'searchParams'>) {
  const { token, error, invite } = await searchParams;
  const t = typeof token === 'string' && !error ? token : null;
  return <ResetPasswordForm token={t} invite={invite === '1'} />;
}
