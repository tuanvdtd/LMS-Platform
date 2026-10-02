'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getAssetUrl } from '@/lib/api/assets';
import type { AssetRef } from '@/types/curriculum';

// Giảng viên xem lại video đã gắn (spec video-upload V8, §5.2): <video> gốc, URL ký hạn 1 giờ.
export function VideoPreviewDialog({ asset, onClose }: { asset: AssetRef | null; onClose: () => void }) {
  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{asset?.fileName}</DialogTitle>
        </DialogHeader>
        {/* key: đổi video → mount lại, state URL bắt đầu từ null. */}
        {asset && <Player key={asset.id} assetId={asset.id} fileName={asset.fileName} />}
      </DialogContent>
    </Dialog>
  );
}

function Player({ assetId, fileName }: { assetId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    getAssetUrl(assetId).then(
      (r) => alive && setUrl(r.url),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [assetId]);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Không mở được video. Đóng rồi mở lại để thử.
      </p>
    );
  }
  if (!url) return <Skeleton className="aspect-video w-full rounded-lg" />;
  return <video src={url} aria-label={fileName} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />;
}
