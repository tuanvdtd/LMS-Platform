'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// adminOnly: moderator không thấy (layout cũng trả 403 nếu mở thẳng URL).
const LINKS = [
  { href: '/admin/course-approvals', label: 'Duyệt khoá học' },
  { href: '/admin/payouts', label: 'Thanh toán giảng viên', adminOnly: true },
  { href: '/admin/moderators', label: 'Moderator', adminOnly: true },
  { href: '/admin/settings', label: 'Cài đặt', adminOnly: true },
];

function Links({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  return LINKS.filter((l) => admin || !l.adminOnly).map((l) => (
    <Link
      key={l.href}
      href={l.href}
      className={cn(
        'block rounded-lg px-3 py-2 text-sm hover:bg-muted',
        pathname.startsWith(l.href) && 'bg-muted font-semibold text-primary',
      )}
    >
      {l.label}
    </Link>
  ));
}

export function AdminNav({ admin }: { admin: boolean }) {
  return (
    <aside className="w-[220px] shrink-0 space-y-1 border-r bg-card p-4">
      <Link href="/" className="mb-4 block font-extrabold">
        SkillPath Admin
      </Link>
      <Suspense>
        <Links admin={admin} />
      </Suspense>
    </aside>
  );
}
