import { Skeleton } from '@/components/ui/skeleton';

// Thân trang Năng lực lớp: khối nguồn số liệu + card từng topic (2 cột: hiện tại / thay đổi).
export function AnalyticsSkillsBody() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-20 w-full rounded-lg" />
      {[0, 1].map((k) => (
        <div key={k} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkillsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-80 max-w-full" />
      </div>
      <AnalyticsSkillsBody />
    </div>
  );
}
