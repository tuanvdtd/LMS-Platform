import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục CourseCard (components/shared/product-ui.tsx): ảnh 16:9, tiêu đề 2 dòng, giảng viên, giá.
export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
