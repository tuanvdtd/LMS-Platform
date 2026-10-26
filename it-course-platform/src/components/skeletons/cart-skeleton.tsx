import { Skeleton } from '@/components/ui/skeleton';

// Cùng khung với trang giỏ thật (tiêu đề, danh sách, tóm tắt) để khi dữ liệu về không bị xô layout.
export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 lg:py-10" role="status" aria-busy="true" aria-label="Đang tải giỏ hàng">
      <h1 className="text-2xl font-bold text-foreground">Giỏ hàng</h1>
      <Skeleton className="mt-1 h-5 w-32" />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <ul className="divide-y rounded-xl border bg-card">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-4 p-4 sm:p-5">
              <Skeleton className="aspect-video w-28 shrink-0 self-start rounded-lg sm:w-40" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full max-w-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2 sm:w-28">
                  <Skeleton className="h-5 w-24 sm:ml-auto" />
                  <Skeleton className="h-4 w-16 sm:ml-auto" />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
