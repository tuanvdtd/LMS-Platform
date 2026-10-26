import type { Metadata } from 'next';
import { PricingForm } from '../_components/pricing-form';

export const metadata: Metadata = { title: 'Định giá | SkillPath' };

export default function PricingPage() {
  return <PricingForm />;
}
