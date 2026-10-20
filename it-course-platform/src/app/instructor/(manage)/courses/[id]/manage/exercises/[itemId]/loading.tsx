import { Skeleton } from '@/components/ui/skeleton';

// Khớp layout trang soạn bài: link quay lại, tiêu đề + nút kiểm tra, tab, 2 khối form.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-9 w-44" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full sm:w-72" />
      </div>
      <Skeleton className="h-11 w-full sm:w-64" />
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
