import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ApprovalDetail } from './_components/approval-detail';

export const instant = false;

export const metadata: Metadata = { title: 'Chi tiết duyệt khoá | SkillPath Admin' };

// ApprovalDetail đọc [id] bằng useParams → bọc Suspense (cacheComponents), như manage/layout.tsx.
export default function AdminApprovalPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ApprovalDetail />
    </Suspense>
  );
}
