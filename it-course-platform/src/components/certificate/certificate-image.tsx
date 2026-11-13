'use client';

import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { certificateImageUrl } from '@/lib/api/certificates';
import { cn } from '@/lib/utils';

// Ảnh do API dựng theo từng chứng chỉ nên dùng <img> thường: không có gì để next/image tối ưu thêm.
// Khung giữ đúng tỉ lệ A4 ngang ngay từ đầu để trang không nhảy khi ảnh về.
export function CertificateImage({ serial, alt, className }: { serial: string; alt: string; className?: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const img = useRef<HTMLImageElement>(null);

  // Ảnh đã nằm trong cache có thể tải xong trước khi React gắn onLoad → kiểm tra lại một lần sau khi gắn.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setState('ready');
  }, []);

  return (
    <div className={cn('relative aspect-[842/595] w-full overflow-hidden rounded-lg border border-border bg-muted', className)}>
      {state === 'loading' && <Skeleton className="absolute inset-0 rounded-none" />}
      {state === 'error' ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Không tải được ảnh chứng chỉ. Bạn vẫn có thể tải bản PDF.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh do API dựng theo từng chứng chỉ, không qua next/image
        <img
          ref={img}
          src={certificateImageUrl(serial)}
          alt={alt}
          width={1684}
          height={1190}
          loading="lazy"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={cn('size-full object-cover transition-opacity duration-300 motion-reduce:transition-none', state === 'ready' ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  );
}
