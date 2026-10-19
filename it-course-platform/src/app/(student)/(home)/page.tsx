import type { Metadata } from 'next';
import { GuestHome } from '../_components/guest-home';

export const metadata: Metadata = { title: 'Trang chủ | SkillPath' };

// Trang chủ khách. Người đã đăng nhập được proxy.ts rewrite sang /home, nên ở đây không đọc cookie:
// trang render tĩnh, chỉ khối khoá học nổi bật có Suspense riêng.
export default function HomePage() {
  return <GuestHome />;
}
