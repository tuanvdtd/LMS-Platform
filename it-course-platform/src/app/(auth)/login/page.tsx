import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthFormSkeleton } from '@/components/skeletons/auth-form-skeleton';
import { LoginView } from '../_components/login-view';

export const metadata: Metadata = { title: 'Đăng nhập | SkillPath' };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// useSearchParams cần Suspense khi trang được prerender tĩnh, để phần còn lại prerender được
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
  // Trang được <Activity> tái sử dụng khi chỉ đổi searchParams → useState không lấy lại reset/error.
  // Đổi key để tạo form mới, vd /login → quên mật khẩu → /login?reset=1 phải hiện banner.
  return (
    <LoginView
      key={`${first(reset)}|${first(error)}`}
      redirect={first(redirect)}
      reset={first(reset) === '1'}
      oauthError={first(error)}
    />
  );
}
