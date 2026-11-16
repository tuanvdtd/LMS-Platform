import type { Metadata } from 'next';
import { TwoFactorForm } from './_components/two-factor-form';

export const metadata: Metadata = { title: 'Xác thực hai lớp | Aolumi' };

// Bước 2 của đăng nhập: /login chuyển sang đây khi tài khoản đã bật xác thực hai lớp.
export default async function TwoFactorPage({ searchParams }: PageProps<'/two-factor'>) {
  const { redirect } = await searchParams;
  return <TwoFactorForm redirect={Array.isArray(redirect) ? redirect[0] : redirect} />;
}
