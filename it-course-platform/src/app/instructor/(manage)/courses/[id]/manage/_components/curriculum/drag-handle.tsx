'use client';

import { GripVertical } from 'lucide-react';

// Tay nắm kéo: nút thật (Tab tới được, Space nhấc/thả bằng KeyboardSensor). Nhận listeners/attributes của useSortable.
export function DragHandle({ label, ...props }: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
