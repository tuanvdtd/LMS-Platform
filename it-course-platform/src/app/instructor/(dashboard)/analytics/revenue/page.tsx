// src/app/instructor/(dashboard)/analytics/revenue/page.tsx
import type { Metadata } from 'next';
import { RevenueView } from './_components/revenue-view';

export const metadata: Metadata = { title: 'Doanh thu & bán hàng | Aolumi' };

export default function AnalyticsRevenuePage() {
  return <RevenueView />;
}
