'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ArrowRight, Download, XIcon } from 'lucide-react';
import { CertificateImage } from '@/components/certificate/certificate-image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { certificateImageUrl, certificatePdfUrl } from '@/lib/api/certificates';

const CelebrateScene = dynamic(() => import('./celebrate-scene'), { ssr: false });

// Nút trên nền ink, cùng kiểu nút trên lớp phủ cuối video
const ON_INK = 'border-ink-border bg-transparent text-ink-foreground hover:bg-ink-hover hover:text-white';

// Hiện một lần ngay lúc học viên hoàn thành bài cuối cùng của khoá: lớp phủ ink toàn màn hình, nội dung đặt thẳng lên nền
// (không đóng khung hộp thoại) nhưng vẫn là dialog: giữ focus bên trong, Esc để đóng.
// Bước 1: pháo giấy + Lumi tốt nghiệp + lời chúc. Bấm "Xem chứng chỉ" sang bước 2: ảnh chứng chỉ + tải PDF.
export function CertificateDialog({ serial, courseTitle, onClose }: { serial: string | null; courseTitle: string; onClose: () => void }) {
  // Giữ mã cuối cùng để nội dung không biến mất trong lúc lớp phủ đang chạy hiệu ứng đóng.
  const [shown, setShown] = useState(serial);
  if (serial && serial !== shown) setShown(serial);
  // Mã chứng chỉ đã sang bước 2; có mã mới thì tự về bước 1.
  const [viewed, setViewed] = useState<string | null>(null);
  const celebrating = shown !== viewed;
  const nextRef = useRef<HTMLButtonElement>(null);
  // API dựng ảnh chứng chỉ mất ~1s (cache 5 phút): tải trước trong lúc học viên xem màn chúc mừng để bước 2 hiện ảnh ngay.
  useEffect(() => {
    if (shown) new Image().src = certificateImageUrl(shown);
  }, [shown]);

  return (
    <Dialog open={serial !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Ink 95%: thân trang học nền trắng, mức thấp hơn vẫn lộ chữ to phía sau (không dùng làm mờ, theo DESIGN.md) */}
        <DialogOverlay className="bg-ink/95 duration-300 data-closed:duration-150" />
        <DialogPrimitive.Popup
          initialFocus={nextRef}
          className="fixed inset-0 z-50 flex overflow-y-auto text-ink-foreground outline-none duration-300 data-closed:duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          {shown && celebrating && (
            <>
              <div aria-hidden className="pointer-events-none fixed inset-0">
                <CelebrateScene artboard="Confetti" className="size-full" />
              </div>
              <div className="relative m-auto flex w-full max-w-xl flex-col items-center px-6 py-10 text-center">
                {/* Giữ sẵn khung theo tỉ lệ artboard nên chữ bên dưới không nhảy khi cảnh tải xong */}
                <div aria-hidden className="aspect-[400/380] max-h-[44vh] w-[min(24rem,84vw)]">
                  <CelebrateScene artboard="Graduate" className="size-full" />
                </div>
                <DialogTitle className="mt-2 text-2xl font-extrabold text-balance sm:text-3xl">
                  Chúc mừng bạn đã hoàn thành khoá học!
                </DialogTitle>
                {/* Tên khoá đứng riêng một dòng để không bị ngắt giữa chừng như khi nằm lẫn trong câu */}
                <DialogDescription className="mt-3 flex flex-col gap-1 text-base text-ink-muted">
                  <span className="text-lg font-semibold text-balance text-ink-foreground">{courseTitle}</span>
                  Chứng chỉ của bạn đã sẵn sàng.
                </DialogDescription>
                <Button ref={nextRef} size="lg" className="mt-8" onClick={() => setViewed(shown)}>
                  Xem chứng chỉ
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </>
          )}
          {shown && !celebrating && (
            <div className="relative m-auto flex w-full max-w-5xl flex-col items-center px-4 py-8 text-center sm:px-6">
              <DialogTitle className="text-xl font-bold">Chứng chỉ của bạn</DialogTitle>
              <DialogDescription className="mt-1 text-ink-muted">{courseTitle}</DialogDescription>
              {/* Gần đúng kích thước gốc của ảnh để nét mảnh và chữ nhỏ không nhoè; giới hạn theo chiều cao để cả bước vừa một màn hình laptop. */}
              <CertificateImage
                serial={shown}
                alt="Chứng chỉ hoàn thành khoá học của bạn"
                className="mt-6 max-w-[calc(64vh*842/595)] border-ink-border bg-ink-hover shadow-xl [&_[data-slot=skeleton]]:bg-white/5"
              />
              <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
                <Link href="/certificates" className={buttonVariants({ variant: 'outline', size: 'lg', className: ON_INK })}>
                  Xem chứng chỉ của tôi
                </Link>
                <a href={certificatePdfUrl(shown)} download className={buttonVariants({ size: 'lg' })}>
                  <Download data-icon="inline-start" />
                  Tải PDF
                </a>
              </div>
            </div>
          )}
          <DialogClose
            render={<Button variant="ghost" size="icon" className="fixed top-3 right-3 size-11 text-ink-foreground hover:bg-ink-hover hover:text-white" />}
          >
            <XIcon />
            <span className="sr-only">Đóng</span>
          </DialogClose>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
