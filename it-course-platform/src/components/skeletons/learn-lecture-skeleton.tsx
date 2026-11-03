// it-course-platform/src/components/skeletons/learn-lecture-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

// Trang bài giảng trong khung học: khung video 16:9 + dải bài học (tên, vị trí + chip trạng thái, "Bài tiếp") + thanh tab + nội dung tab.
export function LearnLectureSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải bài giảng">
      <Skeleton className="aspect-video max-h-[calc(100dvh-13rem)] w-full rounded-none" />
      <div className="flex flex-col gap-3 border-b bg-card px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-2/3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-6 w-44 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-11 w-28 self-end md:self-auto" />
      </div>
      <div className="flex h-13 items-center gap-6 border-b px-5 sm:px-7">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="flex max-w-2xl flex-col gap-3 px-4 pt-6 sm:px-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
