// it-course-platform/src/components/skeletons/learn-shell-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

// Khung học: header h-14 + nội dung (khung video) + mục lục bên phải (lg).
export function LearnShellSkeleton() {
  return (
    <div className="min-h-dvh bg-background" role="status" aria-busy="true" aria-label="Đang tải khoá học">
      <div className="flex h-14 items-center gap-3 border-b bg-card px-4">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-48 max-w-[40%]" />
        <div className="flex-1" />
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="size-9" />
        <Skeleton className="size-9" />
      </div>
      <div className="flex">
        <div className="min-w-0 flex-1">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="hidden w-80 shrink-0 space-y-2 border-l p-3 lg:block">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
