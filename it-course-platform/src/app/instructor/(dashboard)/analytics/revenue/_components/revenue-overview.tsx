'use client';

import { useMemo, useState } from 'react';
import { StatCard } from '@/components/shared/product-ui';
import { RevenueChart } from './revenue-chart';
import { RevenueFilters, type RevenueFilterValue } from './revenue-filters';

const INITIAL_FILTER: RevenueFilterValue = { from: '2026-09-05', to: '2026-10-04', courseId: 'all' };
const REPORT_END = Date.UTC(2026, 9, 4);
const CURRENCY = new Intl.NumberFormat('vi-VN');

function displayDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function RevenueOverview({ courses }: { courses: { id: string; title: string }[] }) {
  const [filter, setFilter] = useState<RevenueFilterValue>(INITIAL_FILTER);
  const mockDays = useMemo(() => Array.from({ length: 90 }, (_, index) => {
    const isoDate = new Date(REPORT_END - (89 - index) * 86400000).toISOString().slice(0, 10);
    return {
      isoDate,
      date: `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`,
      revenue: 2200000 + ((index * 1423811 + index * index * 7919) % 3300000),
      orders: 8 + ((index * 7 + index * index) % 13),
    };
  }), []);

  const selectedCourseIndex = courses.findIndex((course) => course.id === filter.courseId);
  const totalWeight = courses.reduce((sum, _course, index) => sum + index + 2, 0);
  const weight = filter.courseId === 'all' ? 1 : selectedCourseIndex < 0 ? 0 : (selectedCourseIndex + 2) / totalWeight;
  const points = mockDays
    .filter((day) => day.isoDate >= filter.from && day.isoDate <= filter.to)
    .map((day) => ({ date: day.date, revenue: Math.round(day.revenue * weight), orders: Math.round(day.orders * weight) }));
  const totalRevenue = points.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = points.reduce((sum, day) => sum + day.orders, 0);
  const netRevenue = Math.round(totalRevenue * 0.7);
  const averageOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-6">
      <RevenueFilters courses={courses} onApply={setFilter} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Đang xem: {displayDate(filter.from)} – {displayDate(filter.to)} · {filter.courseId === 'all' ? 'Tất cả khoá học' : courses[selectedCourseIndex]?.title}</span>
        <span>Dữ liệu minh hoạ</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Tổng doanh thu" value={`${CURRENCY.format(totalRevenue)}₫`} />
        <StatCard label="Doanh thu thực nhận" value={`${CURRENCY.format(netRevenue)}₫`} sub="Minh hoạ tỷ lệ 70%" />
        <StatCard label="Số đơn" value={CURRENCY.format(totalOrders)} />
        <StatCard label="Giá trị đơn TB" value={`${CURRENCY.format(averageOrder)}₫`} />
        <StatCard label="Tỉ lệ hoàn tiền" value={totalOrders ? '1,4%' : '—'} />
      </div>
      {points.length > 0 ? (
        <RevenueChart data={points} />
      ) : (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold">Doanh thu theo ngày</h2>
          <p className="py-12 text-center text-sm text-muted-foreground">Không có dữ liệu mẫu trong khoảng ngày đã chọn.</p>
        </div>
      )}
    </div>
  );
}
