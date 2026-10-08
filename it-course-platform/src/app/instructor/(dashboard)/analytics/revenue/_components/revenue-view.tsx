'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/shared/product-ui';
import { Skeleton } from '@/components/ui/skeleton';
import { getEarningsSummary } from '@/lib/api/revenue';
import { formatVnd } from '@/types/revenue';
import type { EarningsSummary } from '@/types/revenue';
import { PayoutHistory } from './payout-history';

// Doanh thu thật (spec revenue-share-payout §5). Chưa có checkout → số liệu có thể đều 0.
export function RevenueView() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    getEarningsSummary().then(setSummary, () => toast.error('Không tải được doanh thu'));
  }, []);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Doanh thu</h1>
        {summary && (
          <p className="text-sm text-muted-foreground">
            Bạn nhận {summary.sharePct}% số tiền học viên thanh toán. Doanh thu được chốt và chuyển khoản hằng tháng.
          </p>
        )}
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Chờ chốt" value={formatVnd(summary.unsettled)} sub="Sẽ vào kỳ thanh toán tới" />
          <StatCard label="Chờ chuyển khoản" value={formatVnd(summary.pending)} />
          <StatCard label="Đã nhận" value={formatVnd(summary.paid)} />
        </div>
      ) : (
        <Skeleton className="h-24 w-full" />
      )}

      <PayoutHistory />
    </div>
  );
}
