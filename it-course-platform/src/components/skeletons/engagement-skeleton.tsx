// src/components/skeletons/engagement-skeleton.tsx
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function PanelSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-80 max-w-full" />
      {children}
    </div>
  );
}

// Panel đường giữ chân (cũng dùng khi đổi bài video).
export function RetentionSkeleton() {
  return (
    <PanelSkeleton>
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-20 w-full" />
    </PanelSkeleton>
  );
}

// Thân trang Hành vi học: 3 thẻ chỉ số, biểu đồ 12 tuần, danh sách 6 dòng, bảng 5 dòng, đường giữ chân.
export function EngagementBody() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <PanelSkeleton>
        <Skeleton className="h-60 w-full" />
      </PanelSkeleton>
      <PanelSkeleton>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </PanelSkeleton>
      <PanelSkeleton>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </PanelSkeleton>
      <RetentionSkeleton />
    </div>
  );
}

export function EngagementSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-80 max-w-full" />
      </div>
      <EngagementBody />
    </div>
  );
}
