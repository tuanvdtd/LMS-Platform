'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getPreviewUrl } from '@/lib/api/catalog-client';

export function PreviewDialog({
  slug,
  itemId,
  title,
  open,
  onOpenChange,
}: {
  slug: string;
  itemId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Kết quả gắn với key: đổi bài thì kết quả cũ tự bị bỏ qua, không phải setState reset trong effect.
  const key = `${slug}/${itemId}`;
  const [result, setResult] = useState<{ key: string; url: string | null; error: boolean } | null>(null);
  const current = result?.key === key ? result : null;
  const url = current?.url ?? null;
  const error = current?.error ?? false;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    getPreviewUrl(slug, itemId)
      .then((u) => alive && setResult({ key: `${slug}/${itemId}`, url: u, error: false }))
      .catch(() => alive && setResult({ key: `${slug}/${itemId}`, url: null, error: true }));
    return () => {
      alive = false;
    };
  }, [open, slug, itemId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-8 break-words">Xem thử: {title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>Không tải được video xem thử</AlertDescription>
          </Alert>
        ) : url ? (
          <video src={url} controls autoPlay className="aspect-video w-full rounded-md bg-black" />
        ) : (
          <Skeleton className="aspect-video w-full" role="status" aria-label="Đang tải video" />
        )}
      </DialogContent>
    </Dialog>
  );
}
