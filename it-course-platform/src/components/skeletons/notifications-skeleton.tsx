import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang Thông báo: tiêu đề, hàng chip, danh sách thẻ.
export function NotificationsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true" aria-label="Đang tải thông báo">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="mb-6 flex gap-2">
        {[64, 80, 72].map((w) => (
          <Skeleton key={w} className="h-11 rounded-full sm:h-8" style={{ width: w }} />
        ))}
      </div>
      <NotificationListSkeleton />
    </div>
  );
}

// Chỉ phần danh sách thẻ: trang Thông báo dùng khi đổi chip để header + chip giữ nguyên (không mất focus).
export function NotificationListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Đang tải thông báo">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border p-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
