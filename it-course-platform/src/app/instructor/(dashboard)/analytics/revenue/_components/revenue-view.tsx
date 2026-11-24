// src/app/instructor/(dashboard)/analytics/revenue/_components/revenue-view.tsx
'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RevenueBody as Loading } from '@/components/skeletons/revenue-skeleton';
import { StatCard } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSales } from '@/lib/api/analytics';
import { getEarningsSummary } from '@/lib/api/revenue';
import { formatVnd } from '@/types/revenue';
import type { EarningsSummary } from '@/types/revenue';
import type { RevenueRange } from '@/types/analytics';
import { AnalyticsEmpty, AnalyticsHeader } from '../../_components/analytics-shell';
import { useKeyed } from '../../_components/use-keyed';
import { CourseComparison } from './course-comparison';
import { FunnelPanel } from './funnel-panel';
import { PayoutHistory } from './payout-history';
import { SalesChart } from './sales-chart';

const loadSales = (range: string) => getSales(range as RevenueRange);

export function RevenueView() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [range, setRange] = useState<RevenueRange>('12m');
  const { data: sales, error, reload } = useKeyed(range, loadSales, { keepPrevious: true });

  useEffect(() => {
    getEarningsSummary().then(setSummary, () => toast.error('Không tải được doanh thu'));
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6">
      <AnalyticsHeader
        title="Doanh thu & bán hàng"
        description={
          summary
            ? `Bạn nhận ${summary.sharePct}% số tiền học viên thanh toán. Doanh thu được chốt và chuyển khoản hằng tháng.`
            : 'Doanh thu, khoá nào bán tốt và học viên rời đi ở bước nào.'
        }
      />

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Chờ chốt" value={formatVnd(summary.unsettled)} sub="Sẽ vào kỳ thanh toán tới" />
          <StatCard label="Chờ chuyển khoản" value={formatVnd(summary.pending)} />
          <StatCard label="Đã nhận" value={formatVnd(summary.paid)} />
        </div>
      ) : (
        <Skeleton className="h-28 w-full rounded-xl" />
      )}

      {error ? (
        <AnalyticsEmpty
          icon={AlertTriangle}
          title="Không tải được số liệu bán hàng"
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              <RotateCw data-icon="inline-start" /> Thử lại
            </Button>
          }
        />
      ) : !sales ? (
        <Loading />
      ) : (
        <>
          <div className={cn('flex flex-col gap-6 transition-opacity', sales.range !== range && 'opacity-50')} aria-busy={sales.range !== range}>
            <SalesChart sales={sales} range={range} onRange={setRange} />
            <CourseComparison courses={sales.courses} range={sales.range} />
          </div>
          <FunnelPanel courses={sales.courses} />
        </>
      )}

      <PayoutHistory />
    </div>
  );
}
