import { MessagesLayout } from '@/components/messages/messages-layout';

// Header giảng viên cao 3.5rem + viền 1px; main chiếm phần còn lại, không cuộn cả trang.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MessagesLayout basePath="/instructor/messages" className="h-[calc(100dvh-3.5rem-1px)] min-w-0 flex-1" listClassName="md:w-80">
      {children}
    </MessagesLayout>
  );
}
