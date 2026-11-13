import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { COURSE_GRID } from '@/components/shared/catalog-course-card';

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-6 h-7 w-64" />
      <div className={COURSE_GRID}>
        {Array.from({ length: count }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
