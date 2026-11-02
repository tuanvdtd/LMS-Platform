import { Skeleton } from '@/components/ui/skeleton';
import { PageSlide } from '../../_components/page-slide';

// Khớp layout trang soạn quiz: link quay lại, tiêu đề + nút nhập CSV, tab, dải số câu, thẻ soạn câu.
// Bọc PageSlide: bấm "Soạn câu hỏi" thì khung chờ này là thứ trượt vào trước.
export default function Loading() {
  return (
    <PageSlide>
      <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-9 w-44" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-11 w-full sm:w-72" />
        <div className="flex gap-1.5 overflow-hidden rounded-xl border bg-card p-4">
          {Array.from({ length: 15 }, (_, i) => (
            <Skeleton key={i} className="size-11 shrink-0 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-5 rounded-xl border bg-card p-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-56 w-full" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </PageSlide>
  );
}
