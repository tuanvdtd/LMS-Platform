'use client';
// src/components/messages/messages-layout.tsx — Khung 2 cột: danh sách cuộc + children (khung chat). Mobile chỉ hiện một bên.

import { useSelectedLayoutSegment } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConversationList } from '@/components/messages/conversation-list';

// className: chiều cao của vỏ (mặc định trừ SiteHeader h-16 + viền 1px). listClassName: bề rộng cột danh sách ở ≥ md.
export function MessagesLayout({
  basePath,
  children,
  className,
  listClassName,
}: {
  basePath: string;
  children: React.ReactNode;
  className?: string;
  listClassName?: string;
}) {
  const activeId = useSelectedLayoutSegment();
  return (
    <main className={cn('flex h-[calc(100dvh-4rem-1px)] overflow-hidden bg-background', className)}>
      <aside
        aria-label="Danh sách cuộc trò chuyện"
        className={cn('w-full shrink-0 flex-col border-r bg-card md:w-[360px]', activeId ? 'hidden md:flex' : 'flex', listClassName)}
      >
        <ConversationList basePath={basePath} activeId={activeId} />
      </aside>
      <section aria-label="Khung chat" className={cn('min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden md:flex')}>
        {children}
      </section>
    </main>
  );
}
