import type { Metadata } from 'next';
import { NotificationsView } from './_components/notifications-view';

export const metadata: Metadata = { title: 'Thông báo | SkillPath' };

export default function NotificationsPage() {
  return <NotificationsView />;
}
