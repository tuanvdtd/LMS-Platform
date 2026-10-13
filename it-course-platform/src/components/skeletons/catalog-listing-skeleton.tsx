import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

// Khớp bố cục CatalogListing: breadcrumb, tiêu đề + tổng số, cột bộ lọc (lg), hàng sắp xếp, lưới 3 cột.
export function CatalogListingSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8" role="status" aria-busy="true" aria-label="Đang tải khoá học">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="h-8 w-64 md:h-9" />
      <Skeleton className="mt-2 h-4 w-24" />

      <div className="mt-6 flex gap-8">
        <div className="hidden w-56 shrink-0 flex-col gap-6 lg:flex">
          {[4, 3].map((rows, g) => (
            <div key={g} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-24 lg:hidden" />
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
