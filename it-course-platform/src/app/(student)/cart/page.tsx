import type { Metadata } from 'next';
import CartView from './_components/cart-view';

export const metadata: Metadata = { title: 'Giỏ hàng | SkillPath' };

export default function CartPage() {
  return <CartView />;
}
