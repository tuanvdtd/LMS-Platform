import type { Metadata } from 'next';
import { PromotionsView } from '../_components/promotions-view';

export const metadata: Metadata = { title: 'Khuyến mại | SkillPath' };

export default function PromotionsPage() {
  return <PromotionsView />;
}
