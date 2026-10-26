import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthFormSkeleton } from '@/components/skeletons/auth-form-skeleton';
import { RegisterForm } from './_components/register-form';

export const metadata: Metadata = { title: 'Đăng ký | SkillPath' };

// useSearchParams cần Suspense khi trang được prerender tĩnh (như trang login)
export default function RegisterPage({ searchParams }: PageProps<'/register'>) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <Register searchParams={searchParams} />
    </Suspense>
  );
}

// ?redirect= từ trang login: đăng ký → xác minh email → onboarding → quay lại trang đang dở
async function Register({ searchParams }: Pick<PageProps<'/register'>, 'searchParams'>) {
  const { redirect } = await searchParams;
  return <RegisterForm redirect={Array.isArray(redirect) ? redirect[0] : redirect} />;
}
