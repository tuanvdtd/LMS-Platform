// src/components/messages/messages-skeleton.tsx — Skeleton khớp layout trang tin nhắn (danh sách + khung chat).
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ConversationListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col" role="status" aria-busy="true" aria-label="Đang tải danh sách">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadSkeleton() {
  const rows = [false, false, true, true, false, true];
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" role="status" aria-busy="true" aria-label="Đang tải cuộc trò chuyện">
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden bg-muted/40 p-4">
        {rows.map((mine, i) => (
          <Skeleton key={i} className={cn('h-10 rounded-2xl', mine ? 'self-end' : 'self-start')} style={{ width: `${30 + ((i * 17) % 30)}%` }} />
        ))}
      </div>
      <div className="border-t bg-card p-3">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

// part: 'all' = cả hai cột (dự phòng); 'thread' = chỉ khung chat (loading.tsx nằm trong layout đã có sẵn cột danh sách).
export function MessagesSkeleton({ part = 'all' }: { part?: 'all' | 'thread' }) {
  if (part === 'thread') return <ThreadSkeleton />;
  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="hidden w-[360px] shrink-0 border-r md:block">
        <ConversationListSkeleton />
      </div>
      <ThreadSkeleton />
    </div>
  );
}
