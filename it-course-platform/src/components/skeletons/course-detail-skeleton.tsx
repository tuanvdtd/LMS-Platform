import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục CourseDetailView: hero tối (breadcrumb, tiêu đề, phụ đề, meta), thẻ mua bên phải,
// cột trái gồm "Bạn sẽ học được", chủ đề, nội dung khoá học.
export function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true" aria-label="Đang tải khoá học">
      <div className="bg-slate-800 px-4 py-10">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 lg:pr-[352px]">
          <Skeleton className="h-4 w-48 bg-white/15" />
          <Skeleton className="h-8 w-3/4 bg-white/15 md:h-9" />
          <Skeleton className="h-5 w-2/3 bg-white/15" />
          <Skeleton className="h-4 w-32 bg-white/15" />
          <Skeleton className="h-4 w-40 bg-white/15" />
          <Skeleton className="h-4 w-64 bg-white/15" />
        </div>
      </div>

      <div className="mx-auto grid max-w-screen-xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-first overflow-hidden rounded-2xl border bg-card shadow-lg lg:order-none lg:col-start-2 lg:row-start-1 lg:self-start">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex flex-col gap-4 p-5">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
          <div className="rounded-xl border bg-card p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="mb-3 h-6 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>

          <div>
            <Skeleton className="mb-2 h-6 w-44" />
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="overflow-hidden rounded-xl border">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-none border-b last:border-b-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
