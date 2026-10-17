import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

// Khớp khu kết quả của CatalogListing: thanh công cụ dạng thẻ (lọc · sắp xếp | tổng số), thẻ bộ lọc (lg), lưới 1/2/3 cột.
export function CatalogResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải khoá học">
      <div className="flex items-center gap-2 rounded-2xl border bg-card p-2">
        <Skeleton className="h-11 w-24 lg:hidden" />
        <Skeleton className="h-11 w-40" />
        <Skeleton className="mr-3 ml-auto h-4 w-20" />
      </div>

      <div className="mt-6 flex gap-8">
        <div className="hidden w-64 shrink-0 flex-col self-start rounded-2xl border bg-card p-5 lg:flex">
          {[5, 3].map((rows, g) => (
            <div key={g} className="flex flex-col gap-2 border-t py-4 first:border-t-0 first:pt-0">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 content-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Fallback cả trang: hero (breadcrumb, nhãn, tiêu đề, mô tả, số liệu) + tiêu đề section + khu kết quả.
export function CatalogListingSkeleton() {
  return (
    <div>
      <div className="border-b bg-muted/60">
        <div className="mx-auto max-w-screen-xl px-4 py-10 md:py-14">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-6 h-10 w-96 max-w-full md:h-12" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl" />
          <div className="mt-8 flex gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:py-16">
        <Skeleton className="mb-6 h-9 w-72" />
        <CatalogResultsSkeleton />
      </div>
    </div>
  );
}
