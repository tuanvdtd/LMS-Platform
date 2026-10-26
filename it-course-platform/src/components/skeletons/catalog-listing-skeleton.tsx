import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

// Khớp khu kết quả của CatalogListing: thanh công cụ (lọc · tổng số | sắp xếp), cột bộ lọc (lg), lưới 1/2/3 cột.
export function CatalogResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải khoá học">
      <div className="flex items-center gap-2">
        <Skeleton className="h-11 w-24 lg:hidden" />
        <Skeleton className="hidden h-5 w-24 lg:block" />
        <Skeleton className="ml-auto h-11 w-48" />
      </div>

      <div className="mt-6 flex gap-8">
        <div className="hidden w-56 shrink-0 flex-col self-start lg:flex">
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

// Fallback cả trang: dải đầu (breadcrumb, tiêu đề, dòng số liệu) + tiêu đề section + khu kết quả.
export function CatalogListingSkeleton() {
  return (
    <div>
      <div className="border-b bg-(--primary-light)/60">
        <div className="mx-auto max-w-screen-xl px-4 pt-6 pb-8 md:pt-8 md:pb-10">
          <Skeleton className="h-5 w-64 max-w-full" />
          <Skeleton className="mt-4 h-8 w-80 max-w-full md:h-10" />
          <Skeleton className="mt-3 h-5 w-40" />
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-8 md:py-10">
        <Skeleton className="mb-5 h-7 w-72 max-w-full md:h-8" />
        <CatalogResultsSkeleton />
      </div>
    </div>
  );
}
