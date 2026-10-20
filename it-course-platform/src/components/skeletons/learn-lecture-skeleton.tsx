// it-course-platform/src/components/skeletons/learn-lecture-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

// Trang bài giảng trong khung học: khung video 16:9 + thanh điều hướng + tiêu đề + tab.
export function LearnLectureSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải bài giảng">
      <Skeleton className="aspect-video max-h-[calc(100dvh-10rem)] w-full rounded-none" />
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-28" />
      </div>
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pt-5">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
