import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationDetail } from './_components/application-detail';

export const metadata: Metadata = { title: 'Chi tiết đơn giảng viên | SkillPath Admin' };

// ApplicationDetail đọc [id] bằng useParams → bọc Suspense (useParams cần Suspense khi prerender).
export default function AdminApplicationPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ApplicationDetail />
    </Suspense>
  );
}
