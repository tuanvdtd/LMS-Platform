'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import { CertificateImage } from '@/components/certificate/certificate-image';
import { buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { certificatePdfUrl } from '@/lib/api/certificates';

// Hiện một lần ngay lúc học viên hoàn thành bài cuối cùng của khoá.
export function CertificateDialog({ serial, onClose }: { serial: string | null; onClose: () => void }) {
  return (
    <Dialog open={serial !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chúc mừng bạn đã hoàn thành khoá học!</DialogTitle>
          <DialogDescription>Chứng chỉ của bạn đã sẵn sàng.</DialogDescription>
        </DialogHeader>
        {serial && (
          <>
            {/* Hiện gần đúng kích thước gốc của ảnh để nét mảnh và chữ nhỏ không bị nhoè do thu nhỏ;
                giới hạn theo chiều cao màn hình để hộp thoại không tràn trên màn hình thấp. */}
            <CertificateImage
              serial={serial}
              alt="Chứng chỉ hoàn thành khoá học của bạn"
              className="mx-auto max-w-[calc(68vh*842/595)]"
            />
            <DialogFooter>
              <Link href="/certificates" className={buttonVariants({ variant: 'outline' })}>
                Xem chứng chỉ của tôi
              </Link>
              <a href={certificatePdfUrl(serial)} download className={buttonVariants()}>
                <Download data-icon="inline-start" />
                Tải PDF
              </a>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
