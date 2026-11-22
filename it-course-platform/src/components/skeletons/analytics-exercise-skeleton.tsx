import { Skeleton } from '@/components/ui/skeleton';

// Chi tiết bài code: tiêu đề, 5 ô số, thanh kết quả, bảng test.
export function AnalyticsExerciseSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
