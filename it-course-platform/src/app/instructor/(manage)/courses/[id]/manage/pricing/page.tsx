import type { Metadata } from 'next';
import { PricingForm } from '../_components/pricing-form';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Định giá | SkillPath' };

export default function PricingPage() {
  return <PricingForm />;
}
