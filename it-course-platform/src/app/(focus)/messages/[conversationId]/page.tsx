import type { Metadata } from 'next';
import { Thread } from '@/components/messages/thread';

export const metadata: Metadata = { title: 'Tin nhắn | Aolumi' };

export default async function ConversationPage({ params }: PageProps<'/messages/[conversationId]'>) {
  const { conversationId } = await params;
  return <Thread conversationId={conversationId} basePath="/messages" />;
}
