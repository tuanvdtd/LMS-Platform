// src/components/skeletons/revenue-skeleton.tsx
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function PanelSkeleton({ action, children }: { action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Biểu đồ doanh thu, bảng so sánh 4 dòng, phễu 4 bước.
export function RevenueBody() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
      <PanelSkeleton action={<Skeleton className="h-9 w-44" />}>
        <Skeleton className="h-60 w-full" />
      </PanelSkeleton>
      <PanelSkeleton>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </PanelSkeleton>
      <PanelSkeleton
        action={
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-full sm:w-64" />
            <Skeleton className="h-9 w-48" />
          </div>
        }
      >
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
        <Skeleton className="h-16 w-full" />
      </PanelSkeleton>
    </div>
  );
}

export function RevenueSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <RevenueBody />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
