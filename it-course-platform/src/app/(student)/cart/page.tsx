import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartSkeleton } from '@/components/skeletons/cart-skeleton';
import CartView from './_components/cart-view';

export const metadata: Metadata = { title: 'Giỏ hàng | SkillPath' };

export default function CartPage() {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartView />
    </Suspense>
  );
}
