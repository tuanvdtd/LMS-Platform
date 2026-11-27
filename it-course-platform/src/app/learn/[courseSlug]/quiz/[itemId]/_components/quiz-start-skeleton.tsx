import { Skeleton } from '@/components/ui/skeleton';

// Skeleton khớp layout màn Start (loading.tsx + lúc tải ở client).
// File riêng, không 'use client': loading.tsx/page.tsx (server) render được mà không kéo màn Start vào client.
export function QuizStartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-19 rounded-lg" />)}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full sm:ml-auto sm:w-32" />
      </div>
      <Skeleton className="mt-8 mb-3 h-6 w-40" />
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  );
}
