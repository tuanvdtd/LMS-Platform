'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Download, XIcon } from 'lucide-react';
import { CertificateImage } from '@/components/certificate/certificate-image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { certificatePdfUrl } from '@/lib/api/certificates';

const CelebrateScene = dynamic(() => import('./celebrate-scene'), { ssr: false });

// Hiện một lần ngay lúc học viên hoàn thành bài cuối cùng của khoá.
// Bước 1: cảnh Lumi tốt nghiệp + lời chúc. Bấm "Xem chứng chỉ" sang bước 2: ảnh chứng chỉ + tải PDF.
export function CertificateDialog({ serial, courseTitle, onClose }: { serial: string | null; courseTitle: string; onClose: () => void }) {
  // Giữ mã cuối cùng để nội dung không biến mất trong lúc hộp thoại đang chạy hiệu ứng đóng.
  const [shown, setShown] = useState(serial);
  if (serial && serial !== shown) setShown(serial);
  // Mã chứng chỉ đã sang bước 2; có mã mới thì tự về bước 1.
  const [viewed, setViewed] = useState<string | null>(null);
  const celebrating = shown !== viewed;
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={serial !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={celebrating ? 'gap-0 sm:max-w-md' : 'sm:max-w-4xl'} showCloseButton={!celebrating} initialFocus={nextRef}>
        {shown && celebrating && (
          <>
            {/* Sân khấu tràn mép trên hộp thoại, giữ sẵn khung 3:2 nên không xô layout khi cảnh tải xong. */}
            <div aria-hidden className="-mx-4 -mt-4 aspect-[3/2] overflow-hidden rounded-t-xl bg-illus-stage">
              <CelebrateScene className="size-full" />
            </div>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2 text-ink-foreground hover:bg-ink-hover hover:text-ink-foreground"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Đóng</span>
            </DialogClose>
            <DialogHeader className="items-center px-2 pt-6 pb-5 text-center">
              <DialogTitle className="text-balance">Chúc mừng bạn đã hoàn thành khoá học!</DialogTitle>
              {/* Tên khoá đứng riêng một dòng để không bị ngắt giữa chừng như khi nằm lẫn trong câu */}
              <DialogDescription className="flex flex-col gap-1">
                <span className="text-base font-semibold text-balance text-foreground">{courseTitle}</span>
                Chứng chỉ của bạn đã sẵn sàng.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button ref={nextRef} size="lg" onClick={() => setViewed(shown)}>
                Xem chứng chỉ
                <ArrowRight data-icon="inline-end" />
              </Button>
            </DialogFooter>
          </>
        )}
        {shown && !celebrating && (
          <>
            <DialogHeader>
              <DialogTitle>Chứng chỉ của bạn</DialogTitle>
              <DialogDescription>{courseTitle}</DialogDescription>
            </DialogHeader>
            {/* Hiện gần đúng kích thước gốc của ảnh để nét mảnh và chữ nhỏ không bị nhoè do thu nhỏ;
                giới hạn theo chiều cao màn hình để hộp thoại không tràn trên màn hình thấp. */}
            <CertificateImage
              serial={shown}
              alt="Chứng chỉ hoàn thành khoá học của bạn"
              className="mx-auto max-w-[calc(68vh*842/595)]"
            />
            <DialogFooter>
              <Link href="/certificates" className={buttonVariants({ variant: 'outline' })}>
                Xem chứng chỉ của tôi
              </Link>
              <a href={certificatePdfUrl(shown)} download className={buttonVariants()}>
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
