// …/_components/pdf-viewer.tsx
import { Download, ExternalLink, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { Lecture } from '@/types/learn';
import { MediaState } from './media-state';

// <object> PDF + nút "Mở PDF" luôn có: Chrome Android/iOS không nhúng PDF (spec §7.3).
export function PdfViewer({ lecture }: { lecture: Lecture }) {
  if (!lecture.mediaUrl) {
    return <MediaState icon={FileText} title="Tài liệu chưa sẵn sàng" text="Tài liệu đang được xử lý, quay lại sau ít phút nhé." />;
  }
  return (
    <div className="border-b bg-muted">
      <object data={lecture.mediaUrl} type="application/pdf" aria-label={lecture.title} className="h-[calc(100dvh-10rem)] min-h-96 w-full">
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-16 text-center">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Trình duyệt không hiển thị PDF tại đây — bấm “Mở PDF”.</p>
        </div>
      </object>
      <div className="flex flex-wrap justify-end gap-2 px-4 py-2">
        <a href={lecture.mediaUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', className: 'h-11' })}>
          <ExternalLink data-icon="inline-start" /> Mở PDF
        </a>
        {lecture.downloadUrl && (
          <a href={lecture.downloadUrl} className={buttonVariants({ variant: 'outline', className: 'h-11' })}>
            <Download data-icon="inline-start" /> Tải xuống
          </a>
        )}
      </div>
    </div>
  );
}
