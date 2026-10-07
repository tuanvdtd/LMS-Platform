'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listMyPayouts } from '@/lib/api/revenue';
import { formatPeriod, formatVnd, PAYOUT_STATUS_LABEL } from '@/types/revenue';
import type { MyPayout, Paged, PayoutStatus } from '@/types/revenue';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

function StatusBadge({ status }: { status: PayoutStatus }) {
  return status === 'paid' ? (
    <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">{PAYOUT_STATUS_LABEL[status]}</Badge>
  ) : (
    <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{PAYOUT_STATUS_LABEL[status]}</Badge>
  );
}

export function PayoutHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<MyPayout> | null>(null);

  useEffect(() => {
    let stale = false;
    listMyPayouts(page).then(
      (d) => {
        if (!stale) setData(d);
      },
      () => {
        if (!stale) toast.error('Không tải được lịch sử thanh toán');
      },
    );
    return () => {
      stale = true;
    };
  }, [page]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="overflow-hidden rounded-2xl border bg-card" aria-labelledby="payout-history-title">
      <div className="border-b px-5 py-4">
        <h2 id="payout-history-title" className="font-bold">Lịch sử thanh toán</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chuyển khoản theo tháng dương lịch</p>
      </div>
      {!data ? (
        <div className="p-5"><Skeleton className="h-32 w-full" /></div>
      ) : items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">Chưa có kỳ thanh toán nào.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-150">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col" className="px-5">Kỳ</TableHead>
                  <TableHead scope="col" className="px-5">Số tiền</TableHead>
                  <TableHead scope="col" className="px-5">Trạng thái</TableHead>
                  <TableHead scope="col" className="px-5">Ngày trả</TableHead>
                  <TableHead scope="col" className="px-5">Mã giao dịch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="px-5 font-semibold">{formatPeriod(payout.period)}</TableCell>
                    <TableCell className="px-5 font-mono font-semibold tabular-nums">{formatVnd(payout.amount)}</TableCell>
                    <TableCell className="px-5"><StatusBadge status={payout.status} /></TableCell>
                    <TableCell className="px-5 text-muted-foreground">{payout.paidAt ? fmtDate(payout.paidAt) : '—'}</TableCell>
                    <TableCell className="px-5 font-mono text-muted-foreground">{payout.bankTxnRef ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y md:hidden">
            {items.map((payout) => (
              <div key={payout.id} className="space-y-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>{formatPeriod(payout.period)}</strong>
                  <StatusBadge status={payout.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <strong className="font-mono tabular-nums">{formatVnd(payout.amount)}</strong>
                  <span className="text-xs text-muted-foreground">{payout.paidAt ? `Đã trả ${fmtDate(payout.paidAt)}` : 'Chờ chuyển khoản'}</span>
                </div>
                {payout.bankTxnRef && <p className="text-xs text-muted-foreground">Mã giao dịch: {payout.bankTxnRef}</p>}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">{total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trong </span>
          {total} kỳ thanh toán
        </span>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </section>
  );
}
