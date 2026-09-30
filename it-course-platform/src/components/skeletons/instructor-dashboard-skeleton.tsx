import { Skeleton } from '@/components/ui/skeleton';

export function InstructorDashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
