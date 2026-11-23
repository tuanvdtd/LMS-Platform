import { Skeleton } from '@/components/ui/skeleton';

// Chi tiết quiz: tiêu đề, 5 ô số, histogram, danh sách câu.
export function AnalyticsQuizSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
