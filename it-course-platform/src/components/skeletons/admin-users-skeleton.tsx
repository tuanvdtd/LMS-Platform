import { Skeleton } from '@/components/ui/skeleton';

// Bảng 8 dòng 6 cột, khớp UsersView (avatar + 2 dòng, vai trò, trạng thái, ngày, 2 số).
// nested: true khi nằm trong AdminUsersSkeleton (đã có role/aria ở ngoài cùng).
export function AdminUsersTableSkeleton({ nested = false }: { nested?: boolean }) {
  return (
    <div
      {...(nested ? {} : { role: 'status', 'aria-busy': true, 'aria-label': 'Đang tải danh sách người dùng' })}
      className="flex flex-col gap-3"
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="grid grid-cols-[2.5fr_1.5fr_1.2fr_1fr_0.6fr_0.6fr] items-center gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-8" />
          <Skeleton className="ml-auto h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export function AdminUsersSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách người dùng" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-full sm:w-72" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <AdminUsersTableSkeleton nested />
      </section>
    </div>
  );
}
