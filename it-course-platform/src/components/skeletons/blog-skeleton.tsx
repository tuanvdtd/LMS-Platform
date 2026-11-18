import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục /blog: tiêu đề + ô tìm, hàng chip chủ đề, một thẻ lớn ngang, lưới thẻ (ảnh 16:9 + chữ).
function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <Skeleton className="aspect-video rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>
    </div>
  );
}

export function BlogSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải blog" className="mx-auto max-w-6xl px-4 pt-10 pb-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full md:w-80" />
      </div>
      <div className="mt-8 flex gap-2 overflow-hidden">
        {['w-16', 'w-24', 'w-20', 'w-28', 'w-20', 'w-24'].map((w, i) => (
          <Skeleton key={i} className={`h-9 shrink-0 rounded-full ${w}`} />
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-10">
        <div className="flex flex-col overflow-hidden rounded-xl border md:flex-row">
          <Skeleton className="aspect-video rounded-none md:aspect-auto md:min-h-72 md:w-3/5" />
          <div className="flex flex-1 flex-col justify-center gap-3 p-4 md:p-8">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
