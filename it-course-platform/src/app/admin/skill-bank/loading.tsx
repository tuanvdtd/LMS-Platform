import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TOPIC_COLS } from './_components/topic-cols';

// Khớp bố cục trang: tiêu đề + nút Thêm topic, rồi bảng 6 cột.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('grid items-center gap-x-5 border-b px-5 py-3.5 last:border-b-0', TOPIC_COLS)}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="hidden h-4 w-8 md:block" />
            <Skeleton className="hidden h-4 w-8 md:block" />
            <Skeleton className="hidden h-4 w-8 md:block" />
            <Skeleton className="hidden h-4 w-8 md:block" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
