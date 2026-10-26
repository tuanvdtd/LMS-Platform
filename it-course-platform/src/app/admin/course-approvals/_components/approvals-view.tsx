'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listApprovals } from '@/lib/api/course-approvals';
import { cn } from '@/lib/utils';
import type { AdminApprovalRow } from '@/types/course-approval';
import { APPROVAL_STATUS_LABEL, type ApprovalStatus, formatPrice } from '@/types/instructor-course';
import type { Paged } from '@/types/revenue';

const TABS = Object.keys(APPROVAL_STATUS_LABEL) as ApprovalStatus[];

// Hàng đợi duyệt khoá.
export function ApprovalsView() {
  const router = useRouter();
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AdminApprovalRow> | null>(null);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); setData(null) ở các handler.
  useEffect(() => {
    let stale = false;
    listApprovals({ status, page }).then(
      (d) => {
        if (!stale) setData(d);
      },
      () => {
        if (!stale) toast.error('Không tải được danh sách');
      },
    );
    return () => {
      stale = true;
    };
  }, [status, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Duyệt khoá học</h1>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div role="tablist" aria-label="Trạng thái duyệt" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={status === t}
              onClick={() => {
                setStatus(t);
                setPage(1);
                setData(null);
              }}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm hover:bg-muted',
                status === t && 'bg-muted font-semibold text-primary',
              )}
            >
              {APPROVAL_STATUS_LABEL[t]}
            </button>
          ))}
        </div>

        {!data ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có khoá nào.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20" />
                <TableHead>Khoá học</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(`/admin/course-approvals/${row.id}`)}>
                  <TableCell>
                    {row.course.thumbnailUrl ? (
                      <Image src={row.course.thumbnailUrl} alt="" width={64} height={36} unoptimized className="h-9 w-16 rounded object-cover" />
                    ) : (
                      <div className="h-9 w-16 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.course.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[row.course.category?.parent?.name, row.course.category?.name].filter(Boolean).join(' › ')}
                  </TableCell>
                  <TableCell>
                    <div>{row.course.instructor.name}</div>
                    <div className="text-xs text-muted-foreground">{row.course.instructor.email}</div>
                  </TableCell>
                  <TableCell className="font-mono">{formatPrice(row.course.priceAmount)}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/course-approvals/${row.id}`} className="text-primary hover:underline">
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
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setData(null); setPage((p) => p - 1); }}>
              Trước
            </Button>
            <span>
              Trang {page}/{pages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => { setData(null); setPage((p) => p + 1); }}>
              Sau
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
