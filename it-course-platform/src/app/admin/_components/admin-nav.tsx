'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin/payouts', label: 'Thanh toán giảng viên' },
  { href: '/admin/settings', label: 'Cài đặt' },
];

function Links() {
  const pathname = usePathname();
  return LINKS.map((l) => (
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

export function AdminNav() {
  return (
    <aside className="w-[220px] shrink-0 space-y-1 border-r bg-card p-4">
      <Link href="/" className="mb-4 block font-extrabold">
        SkillPath Admin
      </Link>
      <Suspense>
        <Links />
      </Suspense>
    </aside>
  );
}
