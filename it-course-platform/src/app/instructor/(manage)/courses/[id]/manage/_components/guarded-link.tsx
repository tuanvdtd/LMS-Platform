'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { flashAnchor, useCourse } from './course-provider';

// Link trong trang quản lý: form chưa lưu thì mở dialog hỏi trước khi rời trang (spec §5.3).
// Cùng trang (chỉ đổi #anchor) thì không hỏi. Link có #anchor thì nháy viền ô đích.
export function GuardedLink({
  href,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const { dirty, requestLeave } = useCourse();
  const pathname = usePathname();
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        const leaving = href.split('#')[0] !== pathname;
        if (dirty && leaving) {
          e.preventDefault();
          requestLeave(href);
          return;
        }
        onClick?.(e);
        const anchor = href.split('#')[1];
        if (anchor) flashAnchor(anchor);
      }}
    />
  );
}
