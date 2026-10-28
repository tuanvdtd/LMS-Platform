'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getAssetUrl } from '@/lib/api/assets';
import type { AssetRef } from '@/types/curriculum';

const CourseVideo = dynamic(() => import('@/components/shared/course-video').then((m) => m.CourseVideo), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />,
});

type LoadUrl = (assetId: string) => Promise<{ url: string }>;

// Giảng viên (và admin duyệt khoá qua loadUrl riêng) xem lại video đã gắn. HLS tự đổi chữ ký ngầm.
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
  return (
    <CourseVideo
      key={url}
      src={url}
      aria-label={fileName}
      autoPlay
      onRefreshUrl={() => loadUrl(assetId).then((r) => r.url)}
      className="aspect-video w-full rounded-lg bg-black"
    />
  );
}
