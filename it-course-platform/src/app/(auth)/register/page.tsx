import type { Metadata } from 'next';
import { RegisterForm } from './_components/register-form';

export const metadata: Metadata = { title: 'Đăng ký | SkillPath' };

export default function RegisterPage() {
  return <RegisterForm />;
}
