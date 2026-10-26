import type { Metadata } from 'next';
import { PayoutsView } from './_components/payouts-view';

export const metadata: Metadata = { title: 'Thanh toán giảng viên | SkillPath Admin' };

export default function AdminPayoutsPage() {
  return <PayoutsView />;
}
