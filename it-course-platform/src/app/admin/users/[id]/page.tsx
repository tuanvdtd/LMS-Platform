import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminUserDetailSkeleton } from '@/components/skeletons/admin-user-detail-skeleton';
import { UserDetail } from './_components/user-detail';

export const metadata: Metadata = { title: 'Chi tiết người dùng | Aolumi Admin' };

// UserDetail đọc [id] bằng useParams → bọc Suspense (như course-approvals/[id]).
export default function AdminUserPage() {
  return (
    <Suspense fallback={<AdminUserDetailSkeleton />}>
      <UserDetail />
    </Suspense>
  );
}
