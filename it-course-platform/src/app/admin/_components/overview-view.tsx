'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdminOverviewSkeleton } from '@/components/skeletons/admin-overview-skeleton';
import { getOverview } from '@/lib/api/admin';
import { changePct, RANGE_LABEL } from '@/lib/admin-users';
import { formatVnd } from '@/types/revenue';
import type { AdminOverview, KpiKey, OverviewRange } from '@/types/admin';
import { RevenueTrendChart } from './revenue-trend-chart';

const KPIS: { key: KpiKey; label: string; money?: boolean }[] = [
  { key: 'gmv', label: 'Doanh thu bán khoá', money: true },
  { key: 'platformFee', label: 'Phí sàn thu về', money: true },
  { key: 'paidOrders', label: 'Đơn đã thanh toán' },
  { key: 'newUsers', label: 'Người dùng mới' },
  { key: 'newEnrollments', label: 'Lượt ghi danh mới' },
  { key: 'newCourses', label: 'Khoá mới xuất bản' },
];
const CARD = 'rounded-2xl border bg-card p-5';
const fmtPct = (n: number) => Math.abs(n).toLocaleString('vi-VN');

function ChangeChip({ value, prev }: { value: number; prev: number }) {
  const pct = changePct(value, prev);
  if (pct === null) return <Badge variant="secondary">{value > 0 ? 'Mới' : '—'}</Badge>;
  if (pct > 0) return <Badge variant="secondary"><TrendingUp data-icon="inline-start" />+{fmtPct(pct)}%</Badge>;
  if (pct < 0) return <Badge variant="secondary"><TrendingDown data-icon="inline-start" />−{fmtPct(pct)}%</Badge>;
  return <Badge variant="secondary">0%</Badge>;
}

export function OverviewView() {
  const [range, setRange] = useState<OverviewRange>('30d');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); đổi kỳ thì handler setData(null).
  useEffect(() => {
    let stale = false;
    getOverview(range).then(
      (d) => { if (!stale) setData(d); },
      () => { if (!stale) setError(true); },
    );
    return () => { stale = true; };
  }, [range, reloadKey]);

  const label = RANGE_LABEL[range];
  const queues = data
    ? [
        { href: '/admin/course-approvals', text: 'Khoá chờ duyệt', n: data.queues.courseApprovals },
        { href: '/admin/instructor-applications', text: 'Đơn giảng viên cao cấp chờ duyệt', n: data.queues.instructorApplications },
        { href: '/admin/payouts', text: 'Khoản chi trả chờ chuyển', n: data.queues.payouts },
      ]
    : [];
  const noRevenue = data ? data.daily.every((d) => d.gmv === 0) : true;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">Số liệu {label} gần nhất, so với {label} liền trước</p>
        </div>
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Chọn kỳ"
          value={[range]}
          onValueChange={(v) => {
            if (!v[0] || v[0] === range) return;
            setData(null);
            setError(false);
            setRange(v[0] as OverviewRange);
          }}
        >
          {(Object.keys(RANGE_LABEL) as OverviewRange[]).map((r) => (
            <ToggleGroupItem key={r} value={r} className="aria-pressed:border-primary/40 aria-pressed:bg-primary-soft aria-pressed:text-primary">{RANGE_LABEL[r]}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {error && (
        <div role="alert" className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
          <span className="font-semibold">Không tải được số liệu tổng quan</span>
          <Button variant="outline" size="sm" onClick={() => { setError(false); setReloadKey((k) => k + 1); }}>Thử lại</Button>
        </div>
      )}

      {!data && !error && <AdminOverviewSkeleton />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {KPIS.map(({ key, label: l, money }) => {
              const { value, prev } = data.kpis[key];
              const f = (n: number) => (money ? formatVnd(n) : n.toLocaleString('vi-VN'));
              return (
                <div key={key} className={CARD}>
                  <p className="text-sm text-muted-foreground">{l}</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums">{f(value)}</p>
                  <div className="mt-2"><ChangeChip value={value} prev={prev} /></div>
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">Kỳ trước: {f(prev)}</p>
                </div>
              );
            })}
          </div>

          <section className={CARD}>
            <h2 className="mb-4 font-bold">Doanh thu theo ngày</h2>
            {noRevenue ? <p className="text-sm text-muted-foreground">Chưa có đơn nào trong kỳ này.</p> : <RevenueTrendChart daily={data.daily} />}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className={CARD}>
              <h2 className="mb-4 font-bold">Việc cần làm</h2>
              {queues.every((q) => q.n === 0) && <p className="mb-3 text-sm text-muted-foreground">Không có việc nào đang chờ.</p>}
              <ul className="flex flex-col gap-2">
                {queues.map((q) => (
                  <li key={q.href}>
                    <Link href={q.href} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted">
                      <span>{q.text}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant={q.n > 0 ? 'default' : 'secondary'} className="tabular-nums">{q.n.toLocaleString('vi-VN')}</Badge>
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className={CARD}>
              <h2 className="mb-4 font-bold">Chi trả giảng viên</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Đang chờ chuyển</dt>
                  <dd className="font-semibold tabular-nums">{data.payouts.pendingCount.toLocaleString('vi-VN')} khoản · {formatVnd(data.payouts.pendingAmount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Doanh thu giảng viên chưa chốt kỳ</dt>
                  <dd className="font-semibold tabular-nums">{formatVnd(data.payouts.unsettledAmount)}</dd>
                </div>
              </dl>
              <Link href="/admin/payouts" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-4' })}>Mở trang chi trả</Link>
            </section>
          </div>

          <section className={CARD}>
            <h2 className="mb-4 font-bold">Khoá bán chạy trong kỳ</h2>
            {data.topCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có đơn nào trong kỳ này.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Khoá học</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead className="text-right">Đơn</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCourses.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="tabular-nums">{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.instructorName}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.orders.toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatVnd(c.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['Người dùng', data.totals.users],
                ['Giảng viên cao cấp', data.totals.verifiedInstructors],
                ['Khoá đang bán', data.totals.publishedCourses],
              ] as const
            ).map(([l, n]) => (
              <div key={l} className={CARD}>
                <p className="text-sm text-muted-foreground">{l}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{n.toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
