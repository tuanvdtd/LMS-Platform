import { MessagesLayout } from '@/components/messages/messages-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MessagesLayout basePath="/messages">{children}</MessagesLayout>;
}
