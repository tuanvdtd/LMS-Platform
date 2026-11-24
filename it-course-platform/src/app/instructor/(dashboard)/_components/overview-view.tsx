// src/app/instructor/(dashboard)/_components/overview-view.tsx
'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatCard } from '@/components/shared/product-ui';
import { InstructorDashboardSkeleton } from '@/components/skeletons/instructor-dashboard-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { deltaPct, fmtNum } from '@/lib/analytics';
import { getOverview } from '@/lib/api/analytics';
import { formatVnd } from '@/types/revenue';
import type { InstructorOverview } from '@/types/analytics';
import { AnalyticsEmpty, AnalyticsHeader, Panel } from '../analytics/_components/analytics-shell';
import { RevenueBars } from '../analytics/_components/revenue-bars';
import { SellEmpty } from '../analytics/_components/sell-empty';
import { OverviewAtRisk } from './overview-at-risk';
import { OverviewReviews } from './overview-reviews';
import { OverviewTodo } from './overview-todo';

export function OverviewView() {
  const [data, setData] = useState<InstructorOverview | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    getOverview().then(
      (d) => live && setData(d),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  if (failed) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <AnalyticsEmpty
          icon={AlertTriangle}
          title="Không tải được tổng quan"
          action={
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCw data-icon="inline-start" /> Thử lại
            </Button>
          }
        />
      </div>
    );
  }
  if (!data) return <InstructorDashboardSkeleton />;

  const { kpis: k } = data;
  const sellSub = data.verified ? 'Chưa có khoá có phí' : 'Chưa xác minh hồ sơ';
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6">
      <AnalyticsHeader title={`Xin chào, ${data.name}`} description="Tình hình các khoá học của bạn.">
        <Link href="/instructor/courses" className={buttonVariants({ size: 'sm' })}>
          Tạo khoá học mới
        </Link>
      </AnalyticsHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bạn nhận tháng này"
          value={data.canSell ? formatVnd(k.earnedMonth) : '—'}
          change={data.canSell ? deltaPct(k.earnedMonth, k.earnedPrevMonth) : undefined}
          sub={data.canSell ? undefined : sellSub}
        />
        <StatCard label="Ghi danh mới 30 ngày" value={k.enrollments30d} change={deltaPct(k.enrollments30d, k.enrollmentsPrev30d)} />
        <StatCard label="Học viên hoạt động 7 ngày" value={k.active7d} change={deltaPct(k.active7d, k.active7dPrev)} />
        <StatCard
          label="Đánh giá trung bình"
          value={k.rating === null ? '—' : `${k.rating.toFixed(1).replace('.', ',')} ★`}
          sub={`${fmtNum(k.reviewCount)} đánh giá`}
        />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Hoạt động = xem video, mở / hoàn thành bài, làm quiz hoặc nộp bài code.
      </p>

      <OverviewTodo todo={data.todo} />

      <Panel
        title="Doanh thu 12 tháng"
        action={
          data.canSell && (
            <Link href="/instructor/analytics/revenue" className={buttonVariants({ variant: 'link', size: 'sm' })}>
              Xem chi tiết
            </Link>
          )
        }
      >
        {data.canSell ? <RevenueBars points={data.revenue12m} range="12m" /> : <SellEmpty verified={data.verified} />}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewAtRisk rows={data.atRisk} topCourseId={data.todo.highRisk.topCourseId} />
        <OverviewReviews reviews={data.reviews} rating={k.rating} reviewCount={k.reviewCount} />
      </div>
    </div>
  );
}
