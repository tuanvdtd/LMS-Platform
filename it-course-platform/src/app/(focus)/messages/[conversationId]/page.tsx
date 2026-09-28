import type { Metadata } from 'next';
import MessagesView from '../_components/messages-view';

export const metadata: Metadata = { title: 'Tin nhắn | SkillPath' };

export default async function ConversationPage({ params }: PageProps<'/messages/[conversationId]'>) {
  const { conversationId } = await params;
  return <MessagesView conversationId={conversationId} />;
}
