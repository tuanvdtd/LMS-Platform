import { Skeleton } from '@/components/ui/skeleton';

export function CenteredContentSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20 text-center" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mx-auto size-16 rounded-full" />
      <Skeleton className="mx-auto h-6 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <Skeleton className="mx-auto h-10 w-40" />
    </div>
  );
}
