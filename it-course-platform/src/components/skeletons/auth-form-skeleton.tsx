import { Skeleton } from '@/components/ui/skeleton';

export function AuthFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 px-4 py-16" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mx-auto h-7 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
