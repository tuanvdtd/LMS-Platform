import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang /u/[id]: dải bìa mảnh, ảnh tròn chồng mép bìa + tên, dòng số liệu, thanh mục, rồi các mục.
export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải trang cá nhân">
      <div className="h-28 bg-muted md:h-44" />

      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <Skeleton className="-mt-12 size-24 rounded-full bg-border ring-4 ring-background md:-mt-16 md:size-36" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 md:pb-1">
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
        </div>

        <div className="mt-6 flex h-11 items-center gap-6 border-b">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>

        <div className="flex flex-col gap-12 pt-8 pb-20">
          <div className="flex max-w-[68ch] flex-col gap-2.5">
            <Skeleton className="mb-2 h-7 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div>
            <Skeleton className="mb-4 h-7 w-40" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
