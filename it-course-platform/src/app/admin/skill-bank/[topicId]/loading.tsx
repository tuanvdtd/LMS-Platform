import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang: quay lại, tên topic + chip + 2 nút, tab + lọc độ khó, bảng câu hỏi.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-24" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="hidden h-4 w-10 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
