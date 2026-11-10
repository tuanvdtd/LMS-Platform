import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục CatalogCourseCard: dưới sm là hàng ngang (ảnh nhỏ trái; tên, giảng viên, rồi đánh giá + giá chung dòng);
// từ sm là card dọc (ảnh 16:9, tiêu đề + phụ đề, giảng viên, đánh giá, meta, chân giá + CTA).
export function CourseCardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden rounded-xl border bg-card p-3 sm:flex-col sm:gap-0 sm:p-0">
      <Skeleton className="aspect-video w-28 shrink-0 self-start rounded-md sm:w-full sm:rounded-none" />
      <div className="flex min-w-0 flex-1 flex-wrap content-start items-center gap-x-2.5 gap-y-1.5 sm:flex-col sm:flex-nowrap sm:items-stretch sm:gap-3 sm:p-4">
        <div className="flex w-full flex-col gap-1.5">
          <Skeleton className="h-4 w-full sm:h-5" />
          <Skeleton className="h-4 w-2/3 sm:h-5" />
        </div>
        <div className="w-full">
          <Skeleton className="h-3.5 w-1/3 sm:h-4" />
        </div>
        <Skeleton className="h-4 w-16 sm:w-1/2" />
        <Skeleton className="hidden h-3 w-3/4 xl:block" />
        <div className="flex items-center justify-between sm:border-t sm:pt-3">
          <Skeleton className="h-5 w-16 sm:h-6 sm:w-24" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </div>
      </div>
    </div>
  );
}
