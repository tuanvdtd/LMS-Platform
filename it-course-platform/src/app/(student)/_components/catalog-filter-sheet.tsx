'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Bộ lọc dạng bottom sheet (< lg). children = các nhóm lọc dạng <Link> render ở server.
// Bấm 1 link → đóng sheet ngay (không chờ Suspense remount).
export function CatalogFilterSheet({
  activeCount,
  clearHref,
  children,
}: {
  activeCount: number;
  clearHref: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="min-h-11 lg:hidden" />}>
        <SlidersHorizontal data-icon="inline-start" aria-hidden />
        Bộ lọc
        {activeCount > 0 && <Badge className="tabular-nums">{activeCount}</Badge>}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Bộ lọc</SheetTitle>
        </SheetHeader>
        <div
          className="overflow-y-auto px-4"
          onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}
        >
          {children}
        </div>
        <SheetFooter className="flex-row border-t">
          {activeCount > 0 && (
            <Link href={clearHref} onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
              Xoá bộ lọc
            </Link>
          )}
          <SheetClose render={<Button className="flex-1" />}>Xong</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
