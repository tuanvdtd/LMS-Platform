import type { Metadata } from 'next';
import { RevenueView } from './_components/revenue-view';

export const metadata: Metadata = { title: 'Doanh thu | SkillPath' };

export default function AnalyticsRevenuePage() {
  return <RevenueView />;
}
