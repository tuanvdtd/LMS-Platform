import type { Metadata } from 'next';
import { OrdersView } from './_components/orders-view';

export const metadata: Metadata = { title: 'Lịch sử mua hàng | SkillPath' };

export default function OrdersPage() {
  return <OrdersView />;
}
