import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthFormSkeleton } from '@/components/skeletons/auth-form-skeleton';
import { LoginView } from '../_components/login-view';

export const metadata: Metadata = { title: 'Đăng nhập | SkillPath' };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// cacheComponents: đọc searchParams phải nằm trong Suspense để phần còn lại prerender được
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

// Next 16: searchParams là Promise
async function Login({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { redirect, reset, error } = await searchParams;
  return <LoginView redirect={first(redirect)} reset={first(reset) === '1'} oauthError={first(error)} />;
}
