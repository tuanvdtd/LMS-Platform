'use client';
// src/components/messages/image-viewer.tsx — Xem ảnh tin nhắn cỡ lớn: dialog, nút trước/sau, phím ←/→ chỉ khi đang mở.

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function ImageViewer({
  images,
  index,
  sender,
  onIndexChange,
  onClose,
  onImageError,
}: {
  images: { key: string; url: string }[];
  index: number | null; // null = đóng
  sender: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onImageError?: () => void;
}) {
  const open = index !== null;
  const n = images.length;

  useEffect(() => {
    if (index === null || n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onIndexChange((index + n - 1) % n);
      else if (e.key === 'ArrowRight') onIndexChange((index + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, n, onIndexChange]);

  const img = index === null ? undefined : images[index];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[calc(100%-1rem)] gap-2 p-2 sm:max-w-4xl">
        <DialogTitle className="sr-only">Ảnh do {sender} gửi</DialogTitle>
        <DialogDescription className="sr-only">
          Ảnh {(index ?? 0) + 1}/{n}
        </DialogDescription>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- URL ký tạm của R2, không đi qua next/image
          <img src={img.url} alt={`Ảnh ${(index ?? 0) + 1}/${n} do ${sender} gửi`} onError={onImageError} className="mx-auto max-h-[80vh] min-h-40 w-auto max-w-full min-w-40 rounded-lg object-contain" />
        )}
        {n > 1 && index !== null && (
          <>
            <Button variant="secondary" size="icon" aria-label="Ảnh trước" className="absolute top-1/2 left-3 -translate-y-1/2 shadow-md" onClick={() => onIndexChange((index + n - 1) % n)}>
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Ảnh sau" className="absolute top-1/2 right-3 -translate-y-1/2 shadow-md" onClick={() => onIndexChange((index + 1) % n)}>
              <ChevronRight />
            </Button>
            <p className="text-center text-xs text-muted-foreground tabular-nums" aria-hidden>
              {index + 1}/{n}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
