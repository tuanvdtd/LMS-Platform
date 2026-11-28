'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Check, Copy, Home, RotateCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorScreen } from '@/components/shared/error-screen';

function DigestLine({ digest }: { digest: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <p className="flex items-center justify-center gap-1.5">
      Mã lỗi <span className="font-mono text-foreground select-all">{digest}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={copied ? 'Đã chép mã lỗi' : 'Sao chép mã lỗi'}
        onClick={() => navigator.clipboard.writeText(digest).then(() => setCopied(true), () => {})}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </p>
  );
}

export function ServerErrorContent({ error, retry, standalone }: { error: unknown; retry: () => void; standalone?: boolean }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  const digest = error instanceof Error && 'digest' in error && typeof error.digest === 'string' ? error.digest : null;

  return (
    <ErrorScreen
      scene="Fixer"
      standalone={standalone}
      title="Đã có lỗi xảy ra"
      actions={
        <>
          <Button size="lg" className="w-full sm:w-auto" onClick={retry}><RotateCw />Tải lại trang</Button>
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full sm:w-auto' })}><Home />Về trang chủ</Link>
        </>
      }
      footnote={digest && <DigestLine digest={digest} />}
    >
      Trang này tạm thời chưa tải được. Bạn thử tải lại, hoặc quay lại sau ít phút.
    </ErrorScreen>
  );
}
