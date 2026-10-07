'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { closePeriod, listPayouts } from '@/lib/api/admin';
import { formatPeriod, formatVnd, PAYOUT_STATUS_LABEL } from '@/types/revenue';
import type { AdminPayoutRow, Paged, PayoutStatus } from '@/types/revenue';

// 12 tháng đã kết thúc gần nhất theo giờ VN (chỉ chốt được tháng đã kết thúc — spec §3.3).
function endedPeriods(): string[] {
  const vn = new Date(Date.now() + 7 * 3600_000);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

const SELECT = 'rounded-lg border bg-card px-3 py-1.5 text-sm';

export function PayoutsView() {
  const periods = endedPeriods();
  const [closeTarget, setCloseTarget] = useState(periods[0]);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<PayoutStatus | ''>('pending');
  const [period, setPeriod] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AdminPayoutRow> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); setData(null) ở các handler.
  useEffect(() => {
    let stale = false;
    listPayouts({ page, status: status || undefined, period: period || undefined }).then(
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
  }, [page, status, period, reloadKey]);

  async function close() {
    if (!window.confirm(`Chốt kỳ ${formatPeriod(closeTarget)}? Các khoản đủ ngưỡng sẽ được gom thành payout.`)) return;
    setClosing(true);
    try {
      const r = await closePeriod(closeTarget);
      // Các số đều là số GIẢNG VIÊN, không phải số tiền.
      toast.success(
        `Tạo mới ${r.created} giảng viên, cập nhật ${r.updated} giảng viên. Dưới ngưỡng: ${r.skippedBelowMin} giảng viên` +
          (r.skippedNoBank ? `, thiếu ngân hàng: ${r.skippedNoBank} giảng viên` : '') +
          (r.skippedPaid ? `, đã trả trước đó: ${r.skippedPaid} giảng viên` : ''),
      );
      setData(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error('Không chốt được kỳ, thử lại');
    } finally {
      setClosing(false);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Thanh toán giảng viên</h1>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-5">
        <span className="font-semibold">Chốt kỳ</span>
        <select className={SELECT} value={closeTarget} onChange={(e) => setCloseTarget(e.target.value)} aria-label="Kỳ cần chốt">
          {periods.map((p) => (
            <option key={p} value={p}>
              {formatPeriod(p)}
            </option>
          ))}
        </select>
        <Button onClick={close} disabled={closing}>
          {closing ? 'Đang chốt…' : 'Chốt kỳ'}
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap gap-2">
          <select
            className={SELECT}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PayoutStatus | '');
              setPage(1);
              setData(null);
            }}
            aria-label="Lọc trạng thái"
          >
            <option value="">Mọi trạng thái</option>
            <option value="pending">{PAYOUT_STATUS_LABEL.pending}</option>
            <option value="paid">{PAYOUT_STATUS_LABEL.paid}</option>
          </select>
          <select
            className={SELECT}
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
              setData(null);
            }}
            aria-label="Lọc kỳ"
          >
            <option value="">Mọi kỳ</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {formatPeriod(p)}
              </option>
            ))}
          </select>
        </div>

        {!data ? (
          <Skeleton className="h-40 w-full" />
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có payout nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Giảng viên</th>
                  <th className="py-2 font-medium">Kỳ</th>
                  <th className="py-2 font-medium">Số tiền</th>
                  <th className="py-2 font-medium">Trạng thái</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2">
                      <div className="font-medium">{p.instructor.name}</div>
                      <div className="text-xs text-muted-foreground">{p.instructor.email}</div>
                    </td>
                    <td className="py-2">{formatPeriod(p.period)}</td>
                    <td className="py-2 font-mono">{formatVnd(p.amount)}</td>
                    <td className="py-2">
                      <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{PAYOUT_STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/admin/payouts/${p.id}`} className="text-primary hover:underline">
                        {p.status === 'pending' ? 'Trả tiền' : 'Xem'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setData(null); setPage((p) => p - 1); }}>
              Trước
            </Button>
            <span>
              {page}/{pages}
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
