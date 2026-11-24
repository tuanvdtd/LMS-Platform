// src/app/instructor/(dashboard)/analytics/revenue/_components/sales-chart.tsx
'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fmtNum } from '@/lib/analytics';
import { formatVnd } from '@/types/revenue';
import type { RevenueRange, Sales } from '@/types/analytics';
import { Panel } from '../../_components/analytics-shell';
import { RevenueBars } from '../../_components/revenue-bars';
import { SellEmpty } from '../../_components/sell-empty';

const RANGES: { value: RevenueRange; label: string }[] = [
  { value: '30d', label: '30 ngày' },
  { value: '12m', label: '12 tháng' },
];

export function SalesChart({ sales, range, onRange }: { sales: Sales; range: RevenueRange; onRange: (r: RevenueRange) => void }) {
  return (
    <Panel
      title="Doanh thu"
      description={sales.canSell ? `Bạn nhận ${formatVnd(sales.totals.earned)} · ${fmtNum(sales.totals.sales)} lượt bán` : undefined}
      action={
        <ToggleGroup variant="outline" aria-label="Chọn khoảng thời gian" value={[range]} onValueChange={(v) => v[0] && onRange(v[0] as RevenueRange)}>
          {RANGES.map((r) => (
            <ToggleGroupItem key={r.value} value={r.value} className="min-h-11 px-3 sm:min-h-9 aria-pressed:bg-(--primary-light) aria-pressed:text-primary">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      {sales.canSell ? <RevenueBars points={sales.series} range={sales.range} /> : <SellEmpty verified={sales.verified} />}
    </Panel>
  );
}
