'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAYOUTS = [
  { period: '09/2026', amount: 1400000, status: 'pending', paidAt: null, bankTxnRef: null },
  { period: '08/2026', amount: 2100000, status: 'paid', paidAt: '03/09/2026', bankTxnRef: 'FT25280193' },
] as const;

const CURRENCY = new Intl.NumberFormat('vi-VN');
const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: 'pending' | 'paid' }) {
  return status === 'paid' ? (
    <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Đã trả</Badge>
  ) : (
    <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Chờ trả</Badge>
  );
}

export function PayoutHistory() {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(PAYOUTS.length / PAGE_SIZE));
  const visiblePayouts = PAYOUTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card" aria-labelledby="payout-history-title">
      <div className="border-b px-5 py-4">
        <h2 id="payout-history-title" className="font-bold">Lịch sử thanh toán</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chuyển khoản theo tháng dương lịch · dữ liệu minh hoạ</p>
      </div>
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
            {visiblePayouts.map((payout) => (
              <TableRow key={payout.period}>
                <TableCell className="px-5 font-semibold">{payout.period}</TableCell>
                <TableCell className="px-5 font-mono font-semibold tabular-nums">{CURRENCY.format(payout.amount)} ₫</TableCell>
                <TableCell className="px-5"><StatusBadge status={payout.status} /></TableCell>
                <TableCell className="px-5 text-muted-foreground">{payout.paidAt ?? '—'}</TableCell>
                <TableCell className="px-5 font-mono text-muted-foreground">{payout.bankTxnRef ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y md:hidden">
        {visiblePayouts.map((payout) => (
          <div key={payout.period} className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <strong>Kỳ {payout.period}</strong>
              <StatusBadge status={payout.status} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <strong className="font-mono tabular-nums">{CURRENCY.format(payout.amount)} ₫</strong>
              <span className="text-xs text-muted-foreground">{payout.paidAt ? `Đã trả ${payout.paidAt}` : 'Chờ chuyển khoản'}</span>
            </div>
            {payout.bankTxnRef && <p className="text-xs text-muted-foreground">Mã giao dịch: {payout.bankTxnRef}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, PAYOUTS.length)} trong </span>
          {PAYOUTS.length} kỳ thanh toán
        </span>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </section>
  );
}
