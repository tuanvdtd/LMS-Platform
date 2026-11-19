import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục trang đọc /blog/[slug] (components/post/post-article.tsx): tiêu đề 2 dòng, tóm tắt, dòng tác giả + chủ đề,
// ảnh bìa 21:9, cột chữ 68ch + mục lục bên phải từ lg.
const LINES = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-10/12', 'w-full', 'w-2/3', 'w-full', 'w-3/4'];

export function PostSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải bài viết" className="mx-auto max-w-5xl px-4 pb-24">
      <div className="flex flex-col gap-5 border-b pt-10 pb-8 md:pt-14">
        <div className="flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-9 w-full md:h-10" />
          <Skeleton className="h-9 w-2/3 md:h-10" />
        </div>
        <div className="flex max-w-[68ch] flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-8 aspect-[21/9] w-full rounded-2xl" />
      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,68ch)_13rem] lg:justify-between">
        <div className="flex flex-col gap-3">
          {LINES.map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
          <Skeleton className="mt-6 h-7 w-1/2" />
          {LINES.slice(0, 5).map((w, i) => (
            <Skeleton key={`b${i}`} className={`h-4 ${w}`} />
          ))}
        </div>
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
