'use client';
// src/app/instructor/(dashboard)/messages/_components/instructor-thread.tsx — Khung chat giảng viên + cột thông tin học viên (Sheet khi < xl).

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ContextPanel } from '@/components/messages/context-panel';
import { Thread } from '@/components/messages/thread';

export function InstructorThread({ conversationId }: { conversationId: string }) {
  return (
    <Thread
      conversationId={conversationId}
      basePath="/instructor/messages"
      asideSlot={(d) => <ContextPanel detail={d} />}
      contextSlot={(d) => (
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="xl:hidden" aria-label="Thông tin" />}>
            <Info />
          </SheetTrigger>
          <SheetContent side="right" className="w-80 gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-80">
            <SheetTitle className="sr-only">Thông tin</SheetTitle>
            <SheetDescription className="sr-only">Khoá học, tiến độ và đánh giá của người này</SheetDescription>
            <ContextPanel detail={d} />
          </SheetContent>
        </Sheet>
      )}
    />
  );
}
