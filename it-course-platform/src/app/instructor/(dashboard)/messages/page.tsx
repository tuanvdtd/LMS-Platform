import type { Metadata } from 'next';
import { MessagesEmpty } from '@/components/messages/messages-empty';

export const metadata: Metadata = { title: 'Tin nhắn | Aolumi' };

export default function InstructorMessagesPage() {
  return <MessagesEmpty />;
}
