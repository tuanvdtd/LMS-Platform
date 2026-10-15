import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SuccessView } from './_components/success-view';

export const metadata: Metadata = { title: 'Thanh toán | SkillPath' };

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessView />
    </Suspense>
  );
}
