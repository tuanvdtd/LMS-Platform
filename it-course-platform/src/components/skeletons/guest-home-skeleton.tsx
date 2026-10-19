import { Skeleton } from '@/components/ui/skeleton';

// Khung chờ trang chủ khách: cùng hình khối 2 (hero tối) + khối 3 (card danh mục) để không nhảy layout.
export function GuestHomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải">
      <section className="bg-foreground dark:bg-card">
        <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="flex min-w-0 flex-col gap-5">
            <Skeleton className="h-11 w-full max-w-lg bg-white/10" />
            <Skeleton className="h-11 w-2/3 max-w-sm bg-white/10" />
            <Skeleton className="h-5 w-full max-w-xl bg-white/10" />
            <Skeleton className="h-11 w-full max-w-xl bg-white/10" />
            <Skeleton className="h-11 w-40 bg-white/10" />
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <Skeleton className="mb-5 h-5 w-32" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-7 w-full" />)}
            </div>
            <Skeleton className="mt-5 h-14 w-full rounded-xl" />
          </div>
        </div>
      </section>
      <section className="border-y bg-secondary">
        <div className="mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20">
          <Skeleton className="mb-3 h-8 w-72" />
          <Skeleton className="mb-8 h-5 w-96 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48 rounded-2xl bg-card" />)}
          </div>
        </div>
      </section>
    </div>
  );
}
