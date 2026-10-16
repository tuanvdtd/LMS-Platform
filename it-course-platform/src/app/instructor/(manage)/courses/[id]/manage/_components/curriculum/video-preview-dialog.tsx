'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getAssetUrl } from '@/lib/api/assets';
import type { AssetRef } from '@/types/curriculum';
import { PausingVideo } from '@/components/shared/pausing-video';

type LoadUrl = (assetId: string) => Promise<{ url: string }>;

// Giảng viên xem lại video đã gắn (spec video-upload V8, §5.2): <video> gốc, URL ký hạn 1 giờ.
// loadUrl: admin duyệt khoá truyền loader riêng (spec pricing-submit-review §5.3); mặc định API giảng viên.
export function VideoPreviewDialog({
  asset,
  onClose,
  loadUrl = getAssetUrl,
}: {
  asset: AssetRef | null;
  onClose: () => void;
  loadUrl?: LoadUrl;
}) {
  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{asset?.fileName}</DialogTitle>
        </DialogHeader>
        {/* key: đổi video → mount lại, state URL bắt đầu từ null. */}
        {asset && <Player key={asset.id} assetId={asset.id} fileName={asset.fileName} loadUrl={loadUrl} />}
      </DialogContent>
    </Dialog>
  );
}

function Player({ assetId, fileName, loadUrl }: { assetId: string; fileName: string; loadUrl: LoadUrl }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadUrl(assetId).then(
      (r) => alive && setUrl(r.url),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [assetId, loadUrl]);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Không mở được video. Đóng rồi mở lại để thử.
      </p>
    );
  }
  if (!url) return <Skeleton className="aspect-video w-full rounded-lg" />;
  return <PausingVideo src={url} aria-label={fileName} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />;
}
