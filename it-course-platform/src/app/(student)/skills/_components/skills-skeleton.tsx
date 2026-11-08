import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục /skills: dùng chung cho loading.tsx và trạng thái tải của SkillsView, để trang không nhảy bố cục.
export function SkillsSkeleton() {
  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-8" aria-busy="true">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-6 md:ml-auto">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-20" />)}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="h-60 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-52" />
        <Skeleton className="h-36 w-full" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="mb-4 h-4 w-80 max-w-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-11 w-28 sm:h-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
