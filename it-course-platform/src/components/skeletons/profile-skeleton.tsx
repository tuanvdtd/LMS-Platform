import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang /u/[id]: dải bìa (avatar vuông + tên + chức danh), dải số liệu, rồi các mục dạng sổ.
export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải trang cá nhân">
      <div className="bg-muted">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-6 px-4 pt-10 pb-9 md:flex-row md:items-end md:gap-8 md:pt-20 md:pb-12">
          <Skeleton className="size-24 rounded-2xl bg-border md:size-36" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-10 w-72 max-w-full bg-border md:h-14" />
            <Skeleton className="h-6 w-96 max-w-full bg-border" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full bg-border" />
          </div>
        </div>
      </div>

      <div className="border-b">
        <div className="mx-auto flex max-w-screen-xl gap-7 px-4 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="hidden h-6 w-28 sm:block" />
        </div>
      </div>

      <div className="mx-auto grid max-w-screen-xl gap-x-14 px-4 pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="flex flex-col gap-10">
          <div className="flex max-w-[68ch] flex-col gap-2.5">
            <Skeleton className="mb-3 h-8 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-t pt-8">
            <Skeleton className="mb-5 h-8 w-44" />
            <div className="divide-y border-y">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5">
                  <Skeleton className="aspect-video w-24 shrink-0 rounded-md sm:w-28" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3.5 w-1/3" />
                  </div>
                  <Skeleton className="hidden h-2 w-44 rounded-full sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden flex-col gap-3 border-l pl-4 lg:flex">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>
      </div>
    </div>
  );
}
