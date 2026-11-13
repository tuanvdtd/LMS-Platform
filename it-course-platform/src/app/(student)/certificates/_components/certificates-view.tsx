'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Download, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { CertificateImage } from '@/components/certificate/certificate-image';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { certificatePdfUrl, listMyCertificates } from '@/lib/api/certificates';
import type { CertificateSummary } from '@/types/certificate';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

async function copyVerifyLink(serial: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/verify/${serial}`);
    toast.success('Đã sao chép đường dẫn xác thực');
  } catch {
    toast.error('Không sao chép được, hãy thử lại');
  }
}

function CertificateCard({ cert }: { cert: CertificateSummary }) {
  return (
    <li className="flex flex-col gap-4">
      {cert.revoked ? (
        <div className="flex aspect-[842/595] w-full items-center justify-center rounded-lg border border-border bg-muted px-6 text-center text-sm text-muted-foreground">
          Chứng chỉ này đã bị thu hồi nên không còn xem hay tải được.
        </div>
      ) : (
        <CertificateImage serial={cert.serialNo} alt={`Chứng chỉ khoá ${cert.course.title}`} />
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/course/${cert.course.slug}`} className="font-bold text-foreground hover:underline">
            {cert.course.title}
          </Link>
          {cert.revoked && <Badge variant="destructive">Đã thu hồi</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Cấp ngày {dateOf(cert.issuedAt)} · <span className="font-mono">{cert.serialNo}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!cert.revoked && (
          <a href={certificatePdfUrl(cert.serialNo)} download className={buttonVariants()}>
            <Download data-icon="inline-start" />
            Tải PDF
          </a>
        )}
        <Button variant="outline" onClick={() => copyVerifyLink(cert.serialNo)}>
          <Link2 data-icon="inline-start" />
          Sao chép đường dẫn xác thực
        </Button>
      </div>
    </li>
  );
}

export function CertificatesView() {
  const [items, setItems] = useState<CertificateSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    listMyCertificates().then(
      (i) => { setItems(i); setError(false); },
      () => setError(true),
    );
  }, [nonce]);

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Chứng chỉ của tôi</h1>

      {!items ? (
        error ? (
          <p className="text-muted-foreground">
            Không tải được danh sách chứng chỉ.{' '}
            <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>Thử lại</Button>
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2" aria-busy="true">
            <Skeleton className="aspect-[842/595] w-full" />
            <Skeleton className="aspect-[842/595] w-full" />
          </div>
        )
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Award className="mx-auto mb-4 size-10 text-muted-foreground" aria-hidden />
          <p className="mb-1 text-lg text-foreground">Bạn chưa có chứng chỉ nào</p>
          <p className="mb-4 text-muted-foreground">Hoàn thành toàn bộ bài học của một khoá để nhận chứng chỉ.</p>
          <Link href="/my-learning" className={buttonVariants()}>Tới khoá học của tôi</Link>
        </div>
      ) : (
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {items.map((c) => <CertificateCard key={c.serialNo} cert={c} />)}
        </ul>
      )}
    </div>
  );
}
