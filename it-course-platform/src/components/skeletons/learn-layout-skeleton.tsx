import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// className: app/learn không có SiteHeader → truyền h-screen thay chiều cao mặc định trừ header
export function LearnLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-[calc(100vh-3.5rem)] gap-4 p-4', className)} role="status" aria-busy="true" aria-label="Đang tải">
      <div className="flex-1 space-y-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="hidden w-80 space-y-3 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
