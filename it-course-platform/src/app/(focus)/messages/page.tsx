import type { Metadata } from 'next';
import MessagesView from './_components/messages-view';

export const metadata: Metadata = { title: 'Tin nhắn | Aolumi' };

export default function MessagesPage() {
  return <MessagesView />;
}
