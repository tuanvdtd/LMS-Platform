import type { Metadata } from 'next';
import { NotificationsView } from './_components/notifications-view';

export const metadata: Metadata = { title: 'Thông báo | Aolumi' };

export default function NotificationsPage() {
  return <NotificationsView />;
}
