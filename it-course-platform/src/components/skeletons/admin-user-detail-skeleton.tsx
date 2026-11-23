import { Skeleton } from '@/components/ui/skeleton';

// Khớp UserDetail: link quay lại, đầu trang (avatar 64 + 3 dòng + 2 nút), 4 ô số, lưới card 2 cột.
export function AdminUserDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải thông tin người dùng" className="flex flex-col gap-6">
      <Skeleton className="h-7 w-28" />
      <section className="flex flex-wrap items-start gap-4 rounded-2xl border bg-card p-5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-44" />
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
