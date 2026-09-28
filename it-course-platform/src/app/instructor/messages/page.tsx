import type { Metadata } from 'next';
import MessagesView from '@/app/instructor/messages/_components/messages-view';

export const metadata: Metadata = { title: 'Tin nhắn | SkillPath' };

export default function InstructorMessagesPage() {
  return <MessagesView />;
}
