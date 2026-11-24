import type { Metadata } from 'next';
import { InstructorThread } from '@/app/instructor/(dashboard)/messages/_components/instructor-thread';

export const metadata: Metadata = { title: 'Tin nhắn | Aolumi' };

export default async function ConversationPage({ params }: PageProps<'/instructor/messages/[conversationId]'>) {
  const { conversationId } = await params;
  return <InstructorThread conversationId={conversationId} />;
}
