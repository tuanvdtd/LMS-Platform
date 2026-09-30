import type { Metadata } from 'next';
import MessagesView from '@/app/instructor/(dashboard)/messages/_components/messages-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Tin nhắn | SkillPath' };

export default function InstructorMessagesPage() {
  return <MessagesView />;
}
