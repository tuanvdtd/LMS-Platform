import { Skeleton } from '@/components/ui/skeleton';

// Thân trang Chất lượng bài kiểm tra: bảng quiz + bảng bài code (dùng cả khi đổi khoá).
export function AnalyticsAssessmentsBody() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
      {[4, 2].map((rows, k) => (
        <div key={k} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-72 max-w-full" />
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsAssessmentsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-80 max-w-full" />
      </div>
      <AnalyticsAssessmentsBody />
    </div>
  );
}
