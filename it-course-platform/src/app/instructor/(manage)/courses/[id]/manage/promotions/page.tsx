import type { Metadata } from 'next';
import { PromotionsView } from '../_components/promotions-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Khuyến mại | SkillPath' };

export default function PromotionsPage() {
  return <PromotionsView />;
}
