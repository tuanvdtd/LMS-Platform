'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, CircleCheck, Lock, Search, SearchX, TriangleAlert } from 'lucide-react';
import { useKeyed } from '@/app/instructor/(dashboard)/analytics/_components/use-keyed';
import { AdminUsersTableSkeleton } from '@/components/skeletons/admin-users-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, parseUsersFilter, rememberUsersQuery, ROLE_FILTER_LABEL, STATUS_FILTER_LABEL, usersFilterQuery } from '@/lib/admin-users';
import { listUsers } from '@/lib/api/admin';
import type { AdminUserRow, RoleFilter, StatusFilter, UsersFilter } from '@/types/admin';
import type { Paged } from '@/types/revenue';

const SELECT = 'rounded-lg border bg-card px-3 py-1.5 text-sm';

// key = chuỗi query của bộ lọc → đổi bộ lọc là đổi key, hook tải lại.
const load = (key: string): Promise<Paged<AdminUserRow>> => listUsers(parseUsersFilter(new URLSearchParams(key)));

export function UsersView() {
  const sp = useSearchParams();
  const router = useRouter();
  const filter = parseUsersFilter(new URLSearchParams(sp.toString()));
  const key = usersFilterQuery(filter) || '?'; // useKeyed bỏ qua key rỗng; URLSearchParams bỏ dấu ?
  const { data, error, loading, reload } = useKeyed(key, load, { keepPrevious: true });
  const [q, setQ] = useState(filter.q);
  // Bộ lọc mới nhất + hẹn giờ tìm kiếm: mọi go() từ ô khác phải huỷ hẹn giờ đang chờ, hẹn giờ luôn đọc bộ lọc mới nhất.
  const filterRef = useRef(filter);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    filterRef.current = filter;
    rememberUsersQuery(usersFilterQuery(filter));
  });

  const go = (f: UsersFilter) => {
    clearTimeout(timer.current);
    // Next đồng bộ useSearchParams với history gốc, không cần round-trip server → filter cập nhật ngay, hết race hẹn giờ cũ.
    window.history.replaceState(null, '', `/admin/users${usersFilterQuery(f)}`);
  };

  // Đồng bộ ô tìm khi URL đổi từ nơi khác (Back/Forward, xoá bộ lọc), trừ khi chính ô tìm vừa đẩy giá trị đó lên URL.
  const [prevQ, setPrevQ] = useState(filter.q);
  const [pushedQ, setPushedQ] = useState<string | null>(null);
  if (filter.q !== prevQ) {
    setPrevQ(filter.q);
    if (filter.q !== pushedQ) setQ(filter.q);
    setPushedQ(null);
  }

  // Gõ tìm: đợi 300ms rồi mới đổi URL, về trang 1.
  useEffect(() => {
    if (q.trim() === filterRef.current.q) return;
    timer.current = setTimeout(() => {
      const next = q.trim();
      if (next === filterRef.current.q) return;
      setPushedQ(next);
      go({ ...filterRef.current, q: next, page: 1 });
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = filter.q !== '' || filter.role !== 'all' || filter.status !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Người dùng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Học viên và giảng viên. Tài khoản moderator quản lý ở trang{' '}
          <Link href="/admin/moderators" className="text-primary hover:underline">
            Moderator
          </Link>
          .
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              aria-label="Tìm người dùng theo tên hoặc email"
              maxLength={100}
              className="pl-8"
            />
          </div>
          <select
            className={SELECT}
            value={filter.role}
            onChange={(e) => go({ ...filter, q: q.trim(), role: e.target.value as RoleFilter, page: 1 })}
            aria-label="Lọc vai trò"
          >
            {(Object.keys(ROLE_FILTER_LABEL) as RoleFilter[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_FILTER_LABEL[r]}
              </option>
            ))}
          </select>
          <select
            className={SELECT}
            value={filter.status}
            onChange={(e) => go({ ...filter, q: q.trim(), status: e.target.value as StatusFilter, page: 1 })}
            aria-label="Lọc trạng thái"
          >
            {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_FILTER_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlert />
              </EmptyMedia>
              <EmptyTitle>Không tải được danh sách người dùng</EmptyTitle>
              <EmptyDescription>Kiểm tra kết nối rồi thử lại.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={reload}>
                Thử lại
              </Button>
            </EmptyContent>
          </Empty>
        ) : !data ? (
          <AdminUsersTableSkeleton />
        ) : data.items.length === 0 && data.total > 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Trang này không có người dùng</EmptyTitle>
              <EmptyDescription>Số trang vượt quá kết quả hiện có.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => go({ ...filter, page: 1 })}>
                Về trang 1
              </Button>
            </EmptyContent>
          </Empty>
        ) : data.items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Không tìm thấy người dùng nào</EmptyTitle>
              {filtered && <EmptyDescription>Thử đổi từ khoá hoặc bỏ bớt bộ lọc.</EmptyDescription>}
            </EmptyHeader>
            {filtered && (
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQ('');
                    go({ q: '', role: 'all', status: 'all', page: 1 });
                  }}
                >
                  Xoá bộ lọc
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {data.total.toLocaleString('vi-VN')} người dùng
            </p>
            <div className={loading ? 'opacity-60 transition-opacity' : undefined} aria-busy={loading}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tham gia</TableHead>
                    <TableHead className="text-right">Đang học</TableHead>
                    <TableHead className="text-right">Đang dạy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => router.push(`/admin/users/${u.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            {u.image && <AvatarImage src={u.image} alt="" />}
                            <AvatarFallback>{u.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/users/${u.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {u.name}
                            </Link>
                            <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">{u.roles.includes('instructor') ? 'Giảng viên' : 'Học viên'}</Badge>
                          {u.verified && (
                            <Badge variant="info">
                              <BadgeCheck data-icon="inline-start" />
                              Cao cấp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.status === 'locked' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <Badge variant="danger">
                              <Lock data-icon="inline-start" />
                              Đã khoá
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {u.lockedUntil ? `đến ${formatDate(u.lockedUntil)}` : 'vĩnh viễn'}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="success">
                            <CircleCheck data-icon="inline-start" />
                            Hoạt động
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.enrollmentCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.roles.includes('instructor') ? u.courseCount : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <Button size="sm" variant="outline" disabled={filter.page <= 1} onClick={() => go({ ...filter, page: filter.page - 1 })}>
                  Trước
                </Button>
                <span>
                  Trang {filter.page}/{pages}
                </span>
                <Button size="sm" variant="outline" disabled={filter.page >= pages} onClick={() => go({ ...filter, page: filter.page + 1 })}>
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
