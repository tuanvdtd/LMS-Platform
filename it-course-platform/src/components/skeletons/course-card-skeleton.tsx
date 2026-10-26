import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục CatalogCourseCard: ảnh 16:9, tiêu đề 2 dòng, giảng viên, đánh giá, meta, chân giá + CTA.
export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between border-t pt-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
