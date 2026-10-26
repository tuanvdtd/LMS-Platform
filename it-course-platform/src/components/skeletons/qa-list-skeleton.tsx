// src/components/skeletons/qa-list-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

// Hỏi đáp kiểu bình luận (tab bài giảng + /instructor/qa): avatar + tên/thời gian + 2 dòng nội dung.
export function QaListSkeleton() {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Đang tải hỏi đáp">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 py-3.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
