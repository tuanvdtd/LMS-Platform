import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang Tổng quan: header, 4 thẻ, việc cần làm 2 cột, biểu đồ, 2 panel dưới.
export function InstructorDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-60 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <Skeleton className="h-6 w-44" />
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
