import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục bảng tin /blog: tiêu đề + ô tìm, dòng chủ đề, tab, luồng bài (tác giả, tiêu đề, mô tả, ảnh 16:9, hàng tương tác), cột phải.
function FeedPostSkeleton() {
  return (
    <div className="py-7">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <Skeleton className="mt-4 h-6 w-11/12" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-3/4" />
      <Skeleton className="mt-4 aspect-video rounded-xl" />
      <div className="mt-3 flex gap-2">
        {['w-14', 'w-14', 'w-24'].map((w, i) => (
          <Skeleton key={i} className={`h-9 ${w}`} />
        ))}
      </div>
    </div>
  );
}

export function BlogSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải blog"
      className="mx-auto grid max-w-5xl gap-12 px-4 pt-8 pb-20 lg:grid-cols-[minmax(0,42rem)_17rem] lg:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-9 flex-1" />
        </div>
        <div className="mt-5 flex gap-2 overflow-hidden">
          {['w-24', 'w-20', 'w-16', 'w-28', 'w-20', 'w-24'].map((w, i) => (
            <Skeleton key={i} className={`h-8 shrink-0 rounded-full ${w}`} />
          ))}
        </div>
        <div className="mt-4 flex gap-6 border-b pb-2.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 3 }, (_, i) => (
            <FeedPostSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-6 w-5" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
