import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PayoutDetail } from './_components/payout-detail';

export const instant = false;

export const metadata: Metadata = { title: 'Chi tiết thanh toán | SkillPath Admin' };

export default function AdminPayoutPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PayoutDetail />
    </Suspense>
  );
}
