import { Skeleton } from '@/components/ui/skeleton';

export function AuthFormSkeleton() {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="h-60 bg-ink sm:h-72 lg:h-dvh" />
      <div className="flex justify-center px-4 py-10 lg:items-center lg:px-12">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
