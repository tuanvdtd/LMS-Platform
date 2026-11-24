import { Skeleton } from '@/components/ui/skeleton';

// Cùng lưới với OverviewView: 6 ô KPI, biểu đồ h-72, 2 cột, bảng 5 dòng, dải quy mô.
export function AdminOverviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải tổng quan" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-40" />
            <Skeleton className="mt-3 h-5 w-20 rounded-full" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-5 w-36" />
            <div className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <Skeleton className="h-5 w-48" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
