import type { Metadata } from 'next';
import { LoginView } from '../_components/login-view';

export const metadata: Metadata = { title: 'Đăng nhập | SkillPath' };

export default function LoginPage() {
  return <LoginView />;
}
