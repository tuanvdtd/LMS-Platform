'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCourse } from './course-provider';

// Link trong trang quản lý: form chưa lưu thì hỏi trước khi rời trang (spec §5.3).
// Cùng trang (chỉ đổi #anchor) thì không hỏi.
export function GuardedLink({
  href,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const { dirty } = useCourse();
  const pathname = usePathname();
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        const leaving = href.split('#')[0] !== pathname;
        if (dirty && leaving && !window.confirm('Bỏ thay đổi chưa lưu?')) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
