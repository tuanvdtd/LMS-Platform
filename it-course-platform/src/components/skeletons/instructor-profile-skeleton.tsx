import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

// Khớp bố cục trang /instructors/[id]: avatar tròn + tên + thống kê, giới thiệu, lưới khoá học.
export function InstructorProfileSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10" role="status" aria-busy="true" aria-label="Đang tải giảng viên">
      <div className="mb-10 flex flex-col items-start gap-6 md:flex-row">
        <Skeleton className="size-28 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
      </div>

      <div className="mb-10 flex max-w-3xl flex-col gap-2">
        <Skeleton className="mb-1 h-6 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
