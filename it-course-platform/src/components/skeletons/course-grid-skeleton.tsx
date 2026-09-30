import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-6 h-7 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
