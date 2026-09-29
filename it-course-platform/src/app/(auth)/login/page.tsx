import type { Metadata } from 'next';
import { LoginView } from '../_components/login-view';

export const metadata: Metadata = { title: 'Đăng nhập | SkillPath' };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Next 16: searchParams là Promise
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { redirect, reset, error } = await searchParams;
  return <LoginView redirect={first(redirect)} reset={first(reset) === '1'} oauthError={first(error)} />;
}
