import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminUsersSkeleton } from '@/components/skeletons/admin-users-skeleton';
import { UsersView } from './_components/users-view';

export const metadata: Metadata = { title: 'Người dùng | Aolumi Admin' };

// UsersView đọc bộ lọc bằng useSearchParams → cần Suspense khi prerender.
export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersSkeleton />}>
      <UsersView />
    </Suspense>
  );
}
