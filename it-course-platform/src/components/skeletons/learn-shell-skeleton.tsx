// it-course-platform/src/components/skeletons/learn-shell-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { LearnLectureSkeleton } from './learn-lecture-skeleton';

// Khung học: header ink h-14 + mục lục bên trái (lg) với dải tiến độ ink + trang bài giảng (trang mặc định của khung).
export function LearnShellSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex h-14 items-center gap-3 border-b border-ink-border bg-ink px-3">
        <Skeleton className="size-9 bg-ink-hover" />
        <Skeleton className="size-7 rounded-md bg-ink-hover" />
        <Skeleton className="h-4 w-48 max-w-[40%] bg-ink-hover" />
      </div>
      <div className="flex">
        <div className="hidden w-88 shrink-0 flex-col border-r bg-card lg:flex xl:w-96">
          <div className="flex flex-col gap-2.5 border-b border-ink-border bg-ink px-4 py-3.5">
            <Skeleton className="h-4 w-36 bg-ink-hover" />
            <Skeleton className="h-6 w-full bg-ink-hover" />
            <Skeleton className="h-2 w-full rounded-full bg-ink-hover" />
          </div>
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <LearnLectureSkeleton />
        </div>
      </div>
    </div>
  );
}
