'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listApplications } from '@/lib/api/instructor-application';
import { cn } from '@/lib/utils';
import { type AdminApplicationRow, REVIEW_STATUS_LABEL, type ReviewedStatus } from '@/types/instructor-application';
import type { Paged } from '@/types/revenue';

const TABS = Object.keys(REVIEW_STATUS_LABEL) as ReviewedStatus[];
const EMPTY: Record<ReviewedStatus, string> = {
  pending: 'Không có đơn nào đang chờ duyệt.',
  approved: 'Chưa có đơn nào được duyệt.',
  rejected: 'Chưa có đơn nào bị từ chối.',
};
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const href = (id: string) => `/admin/instructor-applications/${id}`;

// Hàng đợi đơn giảng viên cao cấp.
export function ApplicationsView() {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewedStatus>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AdminApplicationRow> | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset data/failed ở các handler.
  useEffect(() => {
    let stale = false;
    listApplications({ status, page }).then(
      (d) => {
        if (!stale) setData(d);
      },
      () => {
        if (!stale) setFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [status, page, reloadKey]);

  function load(next: { status?: ReviewedStatus; page?: number; reload?: boolean }) {
    setData(null);
    setFailed(false);
    if (next.status) setStatus(next.status);
    if (next.page) setPage(next.page);
    if (next.reload) setReloadKey((k) => k + 1);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const dateLabel = status === 'pending' ? 'Ngày nộp' : 'Ngày xử lý';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Duyệt giảng viên cao cấp</h1>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div role="tablist" aria-label="Trạng thái đơn" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={status === t}
              onClick={() => status !== t && load({ status: t, page: 1 })}
              className={cn('rounded-lg border px-3 py-1.5 text-sm hover:bg-muted', status === t && 'bg-muted font-semibold text-primary')}
            >
              {REVIEW_STATUS_LABEL[t]}
            </button>
          ))}
        </div>

        {failed ? (
          <div className="flex flex-col items-start gap-3 py-6" role="alert">
            <p className="text-sm text-muted-foreground">Không tải được danh sách đơn.</p>
            <Button size="sm" variant="outline" onClick={() => load({ reload: true })}>
              Thử lại
            </Button>
          </div>
        ) : !data ? (
          <div className="space-y-2" role="status" aria-busy="true" aria-label="Đang tải">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{EMPTY[status]}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giảng viên</TableHead>
                <TableHead className="hidden md:table-cell">Chức danh</TableHead>
                <TableHead>{dateLabel}</TableHead>
                <TableHead>
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(href(row.id))}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {row.user.image && <AvatarImage src={row.user.image} alt="" />}
                        <AvatarFallback>{row.user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{row.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">{row.headline ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmt(status === 'pending' ? row.submittedAt : row.reviewedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={href(row.id)} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">
                      Xem
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.total > 0 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load({ page: page - 1 })}>
              Trước
            </Button>
            <span>
              Trang {page}/{pages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => load({ page: page + 1 })}>
              Sau
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
