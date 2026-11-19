import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục /posts: tiêu đề + nút "Viết bài mới", hàng tab, danh sách dòng bài.
export function MyPostsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải bài viết của tôi" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="flex flex-col divide-y rounded-xl border">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-4">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Khớp bố cục trang soạn: thanh trên, "tờ bài" (tiêu đề, tóm tắt, chủ đề, ô ảnh bìa, thanh công cụ, chữ), cột "Để xuất bản".
export function PostEditorSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải trình soạn" className="min-h-[calc(100dvh-4rem)] bg-muted/40">
      <div className="border-b bg-background">
        <div className="mx-auto flex h-13 max-w-[78rem] items-center justify-between gap-4 px-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-[78rem] items-start gap-8 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div className="mx-auto w-full max-w-[54rem] rounded-xl border bg-card">
          <div className="flex flex-col gap-4 px-6 pt-8 pb-6 sm:px-10 sm:pt-10">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="mt-2 h-16 w-full rounded-xl" />
          </div>
          <div className="flex gap-2 border-y px-4 py-2 sm:px-8">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-7 w-72 max-w-full" />
          </div>
          <div className="flex min-h-[20rem] flex-col gap-3 px-6 py-8 sm:px-10">
            {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-2/3'].map((w, i) => (
              <Skeleton key={i} className={`h-4 ${w}`} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
