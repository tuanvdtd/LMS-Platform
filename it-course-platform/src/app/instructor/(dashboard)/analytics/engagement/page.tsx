import type { Metadata } from 'next';
import { EngagementView } from './_components/engagement-view';

export const metadata: Metadata = { title: 'Hành vi học | Aolumi' };

export default function AnalyticsEngagementPage() {
  return <EngagementView />;
}
