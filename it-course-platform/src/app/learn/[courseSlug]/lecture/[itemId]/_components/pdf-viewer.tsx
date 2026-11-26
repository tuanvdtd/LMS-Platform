'use client';

// …/_components/pdf-viewer.tsx
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist';
import { BookOpen, ChevronLeft, ChevronRight, Download, FileText, ScrollText, TriangleAlert, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { Lecture } from '@/types/learn';
import { MediaState } from './media-state';
import { PdfBook, type PdfBookApi } from './pdf-book';
import { bookPageSize, hasNextSpread, hasPrevSpread, spreadLabel } from './pdf-book-pages';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);
// Hai trang dưới ~360px mỗi trang thì chữ quá nhỏ → khung hẹp (điện thoại) chỉ có chế độ cuộn.
const BOOK_MIN_WIDTH = 720;

type ViewMode = 'scroll' | 'book';
const MODE_KEY = 'learn:pdf-view';
function readMode(): ViewMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'book' ? 'book' : 'scroll';
  } catch {
    return 'scroll'; // server / storage bị chặn
  }
}
const SOUND_KEY = 'learn:pdf-sound';
function readSound() {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0'; // mặc định bật
  } catch {
    return true;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage bị chặn → chỉ nhớ trong phiên */
  }
}

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
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [bookSize, setBookSize] = useState(size);
  const [zoomPick, setZoomPick] = useState<number | null>(null); // null = mức mặc định của chế độ đang xem
  const [current, setCurrent] = useState(0); // trang đang đọc (từ 0), dùng chung hai chế độ để đổi chế độ không mất chỗ
  // Sau khi fetch xong mới render trang (pages null lúc hydrate) → đọc localStorage trong initializer không lệch hydrate.
  const [mode, setMode] = useState<ViewMode>(readMode);
  const [sound, setSound] = useState(readSound);
  const bookApi = useRef<PdfBookApi>(null);
  const bookable = size.w >= BOOK_MIN_WIDTH;
  const book = mode === 'book' && bookable;
  // Sếp chốt: sách 100%; cuộn trên màn rộng 75% (trang tràn cả khung thì quá to), màn hẹp (điện thoại) vẫn 100%.
  const zoom = zoomPick ?? (book || !bookable ? 1 : 0.75);
  const first = pages?.[0].getViewport({ scale: 1 });
  const bookPage = bookPageSize(bookSize.w, bookSize.h, first ? first.width / first.height : 1, zoom);
  // Sách vừa khung thì khung không cuộn: lúc lật, lớp bóng của page-flip (khối xoay cao gấp đôi trang) tràn ra ngoài sách
  // và làm hiện thanh cuộn trong chốc lát. Phóng to quá khung thì mới cho cuộn.
  const bookFits = bookPage.width * 2 <= bookSize.w + 1 && bookPage.height <= bookSize.h + 1;

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

  // Khung đổi cỡ (mục lục gập/mở, xoay máy) → các trang vẽ lại theo bề rộng mới.
  useEffect(() => {
    if (!frame) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [frame]);

  // Mục lục gập/mở trượt 300ms → khung đổi rộng từng khung hình; sách chỉ dựng lại khi khung đã đứng yên.
  useEffect(() => {
    const t = setTimeout(() => setBookSize(size), 150);
    return () => clearTimeout(t);
  }, [size]);

  // Về chế độ cuộn (bấm "Cuộn" hoặc khung hẹp lại) → cuộn tới trang đang mở trong sách. Chạy trước khi vẽ và trước
  // callback đầu tiên của các IntersectionObserver, nên bộ đếm và các trang được vẽ theo vị trí mới.
  const scrollToCurrent = useEffectEvent(() => {
    const el = frame?.children[current];
    if (!frame || !el) return;
    const top = el.getBoundingClientRect().top - frame.getBoundingClientRect().top - parseFloat(getComputedStyle(frame).paddingTop);
    frame.scrollBy({ top, behavior: 'instant' });
  });
  useLayoutEffect(() => {
    if (!book) scrollToCurrent();
  }, [book, frame]);

  // Sách vừa khung: lăn chuột / vuốt hai ngón = lật trang (xuống/phải → trang sau). Một lần lăn chỉ lật một cặp: khoá tới khi
  // lật xong và lăn đã ngừng ~200ms, để quán tính trackpad không lật liên tục. Phóng to quá khung thì lăn để cuộn như thường.
  useEffect(() => {
    if (!frame || !book || !bookFits) return;
    let acc = 0;
    let last = 0;
    let lockUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // ctrl + lăn = phóng to của trình duyệt
      e.preventDefault(); // khung không cuộn được → đừng để trang ngoài cuộn theo
      const now = performance.now();
      if (now < lockUntil) {
        lockUntil = Math.max(lockUntil, now + 200);
        return;
      }
      if (now - last > 300) acc = 0; // lăn lẻ tẻ từ lâu không cộng dồn
      last = now;
      const unit = e.deltaMode === 1 ? 16 : 1; // Firefox báo theo dòng
      acc += (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
      if (Math.abs(acc) < 40) return;
      if (acc > 0) bookApi.current?.next();
      else bookApi.current?.prev();
      acc = 0;
      lockUntil = now + 700;
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [frame, book, bookFits]);

  // "Trang x/y": x = trang chiếm nhiều chiều cao khung nhất, tính lại mỗi khi một trang qua mốc 10%.
  useEffect(() => {
    if (!frame || !pages || book) return;
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
        setCurrent(best);
      },
      { root: frame, threshold: THRESHOLDS },
    );
    for (const el of frame.children) io.observe(el);
    return () => io.disconnect();
  }, [frame, pages, book]);

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

  function changeMode(next: ViewMode) {
    setMode(next);
    setZoomPick(null); // đổi chế độ → về mức mặc định của chế độ mới
    save(MODE_KEY, next);
  }

  return (
    <div className="border-b bg-muted">
      {/* Khung cao cố định như bản <object> cũ, trang cuộn bên trong → tab bên dưới không bị đẩy xa. */}
      <div
        ref={setFrame}
        role="region"
        aria-label={title}
        tabIndex={0}
        // page-flip chặn mousedown (không cho focus) → tự focus khung để bấm sách xong dùng ← → lật được.
        onPointerDown={book ? (e) => e.currentTarget.focus({ preventScroll: true }) : undefined}
        onKeyDown={
          book
            ? (e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                e.preventDefault();
                if (e.key === 'ArrowRight') bookApi.current?.next();
                else bookApi.current?.prev();
              }
            : undefined
        }
        className={cn(
          'flex h-[calc(100dvh-10rem)] min-h-96 flex-col gap-3 overflow-auto p-3 outline-none [scrollbar-gutter:stable] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:p-4',
          book && bookFits && 'overflow-hidden',
        )}
      >
        {book ? (
          <PdfBook
            ref={bookApi}
            pages={pages}
            width={bookPage.width}
            height={bookPage.height}
            page={current}
            sound={sound}
            onPageChange={setCurrent}
            onFail={() => setMode('scroll')}
          />
        ) : (
          pages.map((page, i) => <PdfPage key={i} page={page} n={i + 1} width={Math.floor(size.w * zoom)} root={frame} />)
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        {book ? (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-11" aria-label="Trang trước" disabled={!hasPrevSpread(current)} onClick={() => bookApi.current?.prev()}>
              <ChevronLeft />
            </Button>
            <span aria-live="polite" className="min-w-32 text-center text-sm text-muted-foreground tabular-nums">
              {spreadLabel(current, pages.length)}
            </span>
            <Button variant="outline" size="icon" className="size-11" aria-label="Trang sau" disabled={!hasNextSpread(current, pages.length)} onClick={() => bookApi.current?.next()}>
              <ChevronRight />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">
            Trang {current + 1}/{pages.length}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {bookable && (
            <ToggleGroup
              variant="outline"
              spacing={0}
              aria-label="Kiểu xem tài liệu"
              className="mr-2"
              value={[mode]}
              onValueChange={(v) => v[0] && changeMode(v[0] as ViewMode)}
            >
              <ToggleGroupItem value="scroll" className="min-h-11 px-3 aria-pressed:bg-primary-soft aria-pressed:text-primary">
                <ScrollText data-icon="inline-start" /> Cuộn
              </ToggleGroupItem>
              <ToggleGroupItem value="book" className="min-h-11 px-3 aria-pressed:bg-primary-soft aria-pressed:text-primary">
                <BookOpen data-icon="inline-start" /> Lật sách
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {book && (
            <Toggle
              variant="outline"
              aria-label="Tiếng lật trang"
              title={sound ? 'Tắt tiếng lật trang' : 'Bật tiếng lật trang'}
              className="mr-2 size-11 aria-pressed:bg-primary-soft aria-pressed:text-primary"
              pressed={sound}
              onPressedChange={(on) => {
                setSound(on);
                save(SOUND_KEY, on ? '1' : '0');
              }}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </Toggle>
          )}
          <Button variant="outline" size="icon" className="size-11" aria-label="Thu nhỏ" disabled={zoom <= ZOOM_MIN} onClick={() => setZoomPick(zoom - ZOOM_STEP)}>
            <ZoomOut />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="size-11" aria-label="Phóng to" disabled={zoom >= ZOOM_MAX} onClick={() => setZoomPick(zoom + ZOOM_STEP)}>
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
