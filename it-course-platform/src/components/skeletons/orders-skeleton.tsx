import { Skeleton } from '@/components/ui/skeleton';

// Cùng khung với trang lịch sử mua hàng thật để khi dữ liệu về không bị xô layout.
export function OrdersSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:py-10" role="status" aria-busy="true" aria-label="Đang tải lịch sử mua hàng">
      <h1 className="text-2xl font-bold text-foreground">Lịch sử mua hàng</h1>
      <Skeleton className="mt-1 h-5 w-56" />

      <div className="mt-6 space-y-6">
        {[2, 1].map((rows, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-4 border-b bg-foreground/[0.03] px-4 py-3 sm:px-5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="ml-auto h-6 w-28 rounded-full" />
            </div>
            <ul className="divide-y">
              {Array.from({ length: rows }, (_, j) => (
                <li key={j} className="flex gap-4 px-4 py-4 sm:px-5">
                  <Skeleton className="aspect-video w-20 shrink-0 self-start rounded-md sm:w-28" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full max-w-sm" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="hidden h-5 w-24 sm:block" />
                </li>
              ))}
            </ul>
            <div className="flex justify-end border-t px-4 py-4 sm:px-5">
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
