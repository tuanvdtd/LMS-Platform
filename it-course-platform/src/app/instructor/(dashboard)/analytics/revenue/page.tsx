import type { Metadata } from 'next';
import { RevenueView } from './_components/revenue-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Doanh thu | SkillPath' };

export default function AnalyticsRevenuePage() {
  return <RevenueView />;
}
