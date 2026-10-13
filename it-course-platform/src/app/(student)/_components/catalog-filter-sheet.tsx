'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Bộ lọc trên mobile (< lg). children = các nhóm lọc dạng <Link> render ở server.
// Bấm 1 link → đóng sheet ngay (không chờ Suspense remount).
export function CatalogFilterSheet({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
        <SlidersHorizontal data-icon="inline-start" aria-hidden />
        Bộ lọc{activeCount > 0 && ` (${activeCount})`}
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Bộ lọc</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
