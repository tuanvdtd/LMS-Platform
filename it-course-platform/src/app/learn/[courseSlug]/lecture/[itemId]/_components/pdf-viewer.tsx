'use client';

// …/_components/pdf-viewer.tsx
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist';
import { Download, FileText, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Lecture } from '@/types/learn';
import { MediaState } from './media-state';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);

// PDF.js tự vẽ ra canvas thay viewer của trình duyệt: không lộ tiêu đề metadata file, không nút tải/in.
export function PdfViewer({ lecture, onRefreshUrl }: { lecture: Lecture; onRefreshUrl: () => Promise<string | null> }) {
  // Giữ link riêng như VideoPlayer; n tăng mỗi lần "Thử lại" → key mới → tải lại từ đầu.
  const [src, setSrc] = useState({ url: lecture.mediaUrl, n: 0 });

  if (!src.url) {
    return <MediaState icon={FileText} title="Tài liệu chưa sẵn sàng" text="Tài liệu đang được xử lý, quay lại sau ít phút nhé." />;
  }

  async function retry() {
    const url = await onRefreshUrl().catch(() => src.url); // xin link mới; lỗi mạng thì thử lại link cũ
    setSrc((s) => ({ url, n: s.n + 1 }));
  }

  return <PdfDocument key={src.n} url={src.url} title={lecture.title} downloadUrl={lecture.downloadUrl} onRetry={retry} />;
}

function PdfDocument({
  url,
  title,
  downloadUrl,
  onRetry,
}: {
  url: string;
  title: string;
  downloadUrl: string | null;
  onRetry: () => Promise<void>;
}) {
  const [pages, setPages] = useState<PDFPageProxy[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null); // callback ref: observer cần khung làm root
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    (async () => {
      // Bản legacy: bản thường gọi Promise.try, Map.getOrInsertComputed… không polyfill → trình duyệt Next còn hỗ trợ
      // (Chrome 111, Safari 16.4) không mở được PDF, mà nút "Mở PDF" đã bỏ.
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
      // ponytail: tải trọn file — PDF rất lớn thì tốn RAM; khi đó chuyển sang tải từng đoạn + xin lại link.
      task = pdfjs.getDocument({ url, disableRange: true, disableStream: true, wasmUrl: '/pdfjs/wasm/' });
      const doc = await task.promise;
      // Lấy sẵn mọi trang để biết tỉ lệ → chỗ giữ đúng cỡ, thanh cuộn không nhảy khi trang vẽ xong.
      const all = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)));
      if (!cancelled) setPages(all);
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      void task?.destroy(); // huỷ tải + giải phóng document và worker
      // Route cũ bị Next giấu trong <Activity hidden>: giữ state nhưng vẫn chạy cleanup → bỏ các trang của doc vừa huỷ,
      // hiện lại thì tải lại từ đầu (link hết hạn → lỗi → "Thử lại" xin link mới).
      setPages(null);
      setFailed(false);
    };
  }, [url]);

  // Khung đổi rộng (mục lục gập/mở, xoay máy) → các trang vẽ lại theo bề rộng mới.
  useEffect(() => {
    if (!frame) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [frame]);

  // "Trang x/y": x = trang chiếm nhiều chiều cao khung nhất, tính lại mỗi khi một trang qua mốc 10%.
  useEffect(() => {
    if (!frame || !pages) return;
    const io = new IntersectionObserver(
      () => {
        const r = frame.getBoundingClientRect();
        let best = 0;
        let max = 0;
        [...frame.children].forEach((el, i) => {
          const b = el.getBoundingClientRect();
          const shown = Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top);
          if (shown > max) {
            best = i;
            max = shown;
          }
        });
        setCurrent(best + 1);
      },
      { root: frame, threshold: THRESHOLDS },
    );
    for (const el of frame.children) io.observe(el);
    return () => io.disconnect();
  }, [frame, pages]);

  if (failed) {
    return (
      <MediaState icon={TriangleAlert} title="Không tải được tài liệu" text="Kiểm tra kết nối mạng rồi thử lại.">
        <Button className="h-11" onClick={() => { setFailed(false); void onRetry(); }}>
          Thử lại
        </Button>
      </MediaState>
    );
  }
  if (!pages) return <MediaState icon={FileText} title="Đang tải tài liệu…" text="Tài liệu sẽ hiện sau giây lát." />;

  const pageWidth = Math.floor(width * zoom);
  return (
    <div className="border-b bg-muted">
      {/* Khung cao cố định như bản <object> cũ, trang cuộn bên trong → tab bên dưới không bị đẩy xa. */}
      <div
        ref={setFrame}
        role="region"
        aria-label={title}
        tabIndex={0}
        className="flex h-[calc(100dvh-10rem)] min-h-96 flex-col gap-3 overflow-auto p-3 outline-none [scrollbar-gutter:stable] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:p-4"
      >
        {pages.map((page, i) => (
          <PdfPage key={i} page={page} n={i + 1} width={pageWidth} root={frame} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <span className="text-sm text-muted-foreground tabular-nums">
          Trang {current}/{pages.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-11" aria-label="Thu nhỏ" disabled={zoom <= ZOOM_MIN} onClick={() => setZoom((z) => z - ZOOM_STEP)}>
            <ZoomOut />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="size-11" aria-label="Phóng to" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((z) => z + ZOOM_STEP)}>
            <ZoomIn />
          </Button>
          {downloadUrl && (
            <a href={downloadUrl} className={buttonVariants({ variant: 'outline', className: 'ml-2 h-11' })}>
              <Download data-icon="inline-start" /> Tải xuống
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Một trang: chỉ vẽ khi cách khung ≤ 1 chiều cao khung; ra xa thì xoá bitmap cho nhẹ RAM.
function PdfPage({ page, n, width, root }: { page: PDFPageProxy; n: number; width: number; root: HTMLElement | null }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const base = page.getViewport({ scale: 1 });

  useEffect(() => {
    const box = boxRef.current;
    if (!root || !box) return;
    const io = new IntersectionObserver((es) => setNear(es[es.length - 1].isIntersecting), { root, rootMargin: '100% 0px' });
    io.observe(box);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!near || !width || !canvas) return;
    const viewport = page.getViewport({ scale: (width / base.width) * devicePixelRatio });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const task = page.render({ canvas, viewport });
    task.promise.catch(() => {}); // bị huỷ giữa chừng (đổi bề rộng / rời bài) → bỏ qua
    return () => {
      task.cancel();
      canvas.width = canvas.height = 0;
    };
  }, [near, width, page, base.width]);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={`Trang ${n}`}
      className="relative mx-auto shrink-0 bg-white shadow-sm" // màu giấy, cố ý không theo theme
      style={{ width: width || '100%', aspectRatio: `${base.width} / ${base.height}` }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
