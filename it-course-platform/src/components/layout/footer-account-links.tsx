'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { isStaff } from '@/lib/instructor-role';

// Cột "Học viên" của footer: footer nằm ở layout chung nên đổi link theo người xem.
// Đang tải session thì hiện link của khách (footer nằm cuối trang, đổi muộn không ai thấy).
export function FooterAccountLinks({ className }: { className: string }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const items = !user
    ? [
        { label: 'Đăng ký miễn phí', href: '/register' },
        { label: 'Đăng nhập', href: '/login' },
      ]
    : isStaff(user)
      ? [{ label: 'Khu quản trị', href: '/admin' }]
      : [
          { label: 'Khoá học của tôi', href: '/my-learning' },
          { label: 'Kỹ năng của tôi', href: '/skills' },
          { label: 'Chứng chỉ', href: '/certificates' },
        ];
  return (
    <ul className="grid gap-1">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className={className}>
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
