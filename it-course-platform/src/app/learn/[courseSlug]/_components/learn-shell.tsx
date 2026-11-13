// it-course-platform/src/app/learn/[courseSlug]/_components/learn-shell.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSelectedLayoutSegment } from 'next/navigation';
import { ChevronRight, FileQuestion, Library, Lock, PanelLeftClose, PanelLeftOpen, TriangleAlert, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LearnShellSkeleton } from '@/components/skeletons/learn-shell-skeleton';
import { apiMessage } from '@/lib/api/checkout';
import { getOutline, setLastItem } from '@/lib/api/learn';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { useNotificationStore } from '@/lib/notification-store';
import { usePointerFocus } from '@/lib/use-pointer-focus';
import { cn } from '@/lib/utils';
import type { LearnOutline } from '@/types/learn';
import { CertificateDialog } from './certificate-dialog';
import { CourseOutline } from './course-outline';
import { flatItems, itemHref, neighbors } from './learn-nav';
import { StateMessage } from './state-message';

type SidebarMode = 'docked' | 'drawer';
type Shell = {
  outline: LearnOutline;
  markCompleted: (itemId: string, progressPct?: number, completed?: boolean) => void; // completed=false: bỏ tick
  reloadOutline: () => void;
  celebrate: (serial: string) => void; // mở hộp thoại chúc mừng cho chứng chỉ vừa cấp
  setSidebarMode: (mode: SidebarMode) => void;
};

const ShellContext = createContext<Shell | null>(null);

export function useLearnShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useLearnShell phải nằm trong LearnShell');
  return ctx;
}

// Trang con khai báo chế độ mục lục: bài giảng / màn quiz thường = docked; đang làm quiz, bài code = drawer.
export function useSidebarMode(mode: SidebarMode) {
  const { setSidebarMode } = useLearnShell();
  useEffect(() => setSidebarMode(mode), [mode, setSidebarMode]);
}

const DOCK_KEY = 'learn:sidebar-docked';
function readDocked() {
  try {
    return localStorage.getItem(DOCK_KEY) !== '0';
  } catch {
    return true; // server / storage bị chặn
  }
}

// Mục bấm được trên header ink: cùng cao 44px, chữ ink-foreground, hover ink-hover.
const headerBtn =
  'inline-flex shrink-0 items-center justify-center rounded-md text-ink-foreground outline-none transition-colors hover:bg-ink-hover focus-visible:ring-3 focus-visible:ring-ring/50 [&_.lucide:not([class*=size-])]:size-4';
const INK_TRACK = '[&_[data-slot=progress-track]]:bg-ink-hover';

// Khung học chung: tải mục lục một lần, giữ khi chuyển bài. Header trắng liền chất liệu với mục lục bên trái;
// khối tối duy nhất là khung video.
export function LearnShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ courseSlug: string; itemId: string }>();
  const courseSlug = params.courseSlug;
  const itemId: string | undefined = params.itemId; // /learn/<slug> không có itemId
  const segment = useSelectedLayoutSegment(); // 'lecture' | 'quiz' | 'code' | null
  const [outline, setOutline] = useState<LearnOutline | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [mode, setMode] = useState<SidebarMode>('docked');
  const [docked, setDocked] = useState(readDocked);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pointerFocus = usePointerFocus();

  useEffect(() => {
    let cancelled = false;
    getOutline(courseSlug).then(
      (o) => { if (!cancelled) setOutline(o); },
      (e) => { if (!cancelled) setError({ code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, nonce]);

  // Ghi bài đang học cho "Tiếp tục học"; lỗi bỏ qua.
  const ready = outline !== null;
  useEffect(() => {
    if (ready && itemId) setLastItem(courseSlug, itemId).catch(() => undefined);
  }, [ready, courseSlug, itemId]);

  const markCompleted = useCallback(
    (id: string, progressPct?: number, completed = true) => {
      setOutline((o) =>
        o && {
          ...o,
          progressPct: progressPct ?? o.progressPct,
          sections: o.sections.map((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, completed } : i)) })),
        },
      );
      // Quiz/code không trả % → tải lại mục lục để lấy % thật.
      if (progressPct === undefined) getOutline(courseSlug).then(setOutline, () => undefined);
    },
    [courseSlug],
  );

  // Lượt quiz trượt không đánh dấu hoàn thành nhưng đổi danh sách "Ôn lại" → tải lại mục lục.
  const reloadOutline = useCallback(() => {
    getOutline(courseSlug).then(setOutline, () => undefined);
  }, [courseSlug]);

  // Mỗi mã chứng chỉ chỉ mở hộp thoại chúc mừng một lần trong phiên.
  const [cert, setCert] = useState<{ open: string | null; seen: string[] }>({ open: null, seen: [] });
  const celebrate = useCallback((serial: string) => {
    setCert((c) => (c.seen.includes(serial) ? c : { open: serial, seen: [...c.seen, serial] }));
  }, []);

  // Bài code được chấm ở nền: kết quả chấm tới qua thông báo, bài vừa làm khoá hoàn thành thì kèm mã chứng chỉ.
  useEffect(
    () =>
      useNotificationStore.subscribe((s, prev) => {
        const n = s.lastReceived;
        if (!n || n === prev.lastReceived || n.type !== 'verdict') return;
        const serial = (n.data as { certificateSerial?: string }).certificateSerial;
        if (serial) celebrate(serial);
      }),
    [celebrate],
  );

  const ctx = useMemo(
    () => (outline ? { outline, markCompleted, reloadOutline, celebrate, setSidebarMode: setMode } : null),
    [outline, markCompleted, reloadOutline, celebrate],
  );

  if (!outline || !ctx) {
    if (!error) return <LearnShellSkeleton />;
    const courseLink = (
      <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: 'outline', className: 'h-11' })}>Về trang khoá học</Link>
    );
    if (error.code === 'NOT_ENROLLED') {
      return (
        <StateMessage icon={Lock} title="Bạn chưa ghi danh khoá học này" text="Ghi danh khoá học để vào học và theo dõi tiến độ.">
          <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: 'accent', className: 'h-11' })}>Xem khoá học</Link>
        </StateMessage>
      );
    }
    if (error.code === 'COURSE_NOT_FOUND') {
      return (
        <StateMessage icon={FileQuestion} title="Không tìm thấy khoá học" text="Khoá học không tồn tại hoặc đã bị xoá.">
          <Link href="/my-learning" className={buttonVariants({ className: 'h-11' })}>Học tập của tôi</Link>
        </StateMessage>
      );
    }
    return (
      <StateMessage icon={TriangleAlert} title="Không tải được khoá học" text={error.message}>
        <Button className="h-11" onClick={() => { setError(null); setNonce((n) => n + 1); }}>Thử lại</Button>
        {courseLink}
      </StateMessage>
    );
  }

  const items = flatItems(outline);
  const { next } = neighbors(outline, itemId);
  const nextHref = next && itemHref(courseSlug, next);
  const done = items.filter((i) => i.completed).length;
  const pct = Math.round(outline.progressPct);
  const showDock = mode === 'docked' && docked;
  const toggleDock = () => {
    setDocked((d) => {
      try { localStorage.setItem(DOCK_KEY, d ? '0' : '1'); } catch { /* storage bị chặn: chỉ không nhớ lựa chọn */ }
      return !d;
    });
  };
  // Dải tiến độ đầu mục lục: nền ink nối liền header thành chữ L tối (header không lơ lửng trên cột trắng);
  // con số đo được đứng trước (Transparent Scorecard).
  const progressBand = (title: React.ReactNode) => (
    <div className="flex flex-col gap-2.5 border-b border-ink-border bg-ink px-4 py-3.5 text-ink-foreground">
      {title}
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs text-ink-muted tabular-nums">
          Đã hoàn thành <span className="font-semibold text-ink-foreground">{done}/{items.length}</span> bài
        </p>
        <p className="text-2xl leading-none font-extrabold text-primary tabular-nums">{pct}%</p>
      </div>
      <Progress value={pct} aria-label="Tiến độ khoá học" className={INK_TRACK} />
    </div>
  );

  return (
    <ShellContext value={ctx}>
      <div className="min-h-dvh bg-background" {...pointerFocus}>
        {/* Mục lục đứng trước nội dung trong thứ tự Tab → cho người dùng bàn phím nhảy thẳng vào bài. */}
        <a
          href="#learn-main"
          className="sr-only rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        >
          Tới nội dung bài học
        </a>
        <header className="sticky top-0 z-30 flex h-14 border-b border-ink-border bg-ink text-ink-foreground">
          {/* Nhóm trái: khi mục lục đang hiện (lg) rộng đúng bằng cột mục lục, viền phải nối liền viền mục lục
              → header chia 2 cột như layout bên dưới. */}
          {/* Viền phải luôn có trên lg (khi thu gọn nó làm vạch ngăn sau logo); bề rộng trượt cùng nhịp với cột mục lục
              (interpolate-size: co giãn tới "auto", trình duyệt cũ thì nhảy thẳng). */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-1 px-1.5 sm:px-2 lg:border-r lg:border-ink-border lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:[interpolate-size:allow-keywords] motion-reduce:transition-none',
              showDock ? 'lg:w-88 xl:w-96' : 'lg:w-auto',
            )}
          >
            {/* Mỗi khổ chỉ hiện một nút mục lục: ngăn trượt (mobile / quiz đang làm / bài code) hoặc ẩn-hiện cột trái (desktop). */}
            <button type="button" className={cn(headerBtn, 'size-11', mode === 'docked' && 'lg:hidden')} onClick={() => setDrawerOpen(true)} aria-label="Mở nội dung khoá học">
              <PanelLeftOpen />
            </button>
            {mode === 'docked' && (
              <button
                type="button"
                className={cn(headerBtn, 'hidden size-11 lg:inline-flex')}
                onClick={toggleDock}
                aria-pressed={docked}
                aria-label={docked ? 'Ẩn nội dung khoá học' : 'Hiện nội dung khoá học'}
                title={docked ? 'Ẩn nội dung khoá học' : 'Hiện nội dung khoá học'}
              >
                {docked ? <PanelLeftClose /> : <PanelLeftOpen />}
              </button>
            )}
            <Link href="/" aria-label="SkillPath — trang chủ" className={cn(headerBtn, 'h-11 gap-1.5 px-1.5')}>
              <LogoMark className="h-7" />
              <span className="hidden text-base font-bold sm:inline">
                SkillPath
              </span>
            </Link>
          </div>

          {/* Nhóm phải: tên khoá thẳng hàng tên bài ở dải dưới video (lg: 16px + 8px đệm link = 24px như px-6 của dải). */}
          <div className="flex min-w-0 flex-1 items-center gap-1 pr-2 sm:gap-2 sm:pr-4 lg:pl-4">
            <span className="mx-1 h-5 w-px shrink-0 bg-ink-border lg:hidden" aria-hidden />
            <Link
              href={`/course/${outline.course.slug}`}
              title={outline.course.title}
              className={cn(headerBtn, 'h-11 min-w-0 shrink justify-start px-2 text-sm font-semibold')}
            >
              <span className="truncate">{outline.course.title}</span>
            </Link>
            <div className="flex-1" />
            {/* Tiến độ khi mục lục không trên màn (mobile, quiz đang làm, bài code, đã ẩn): header là thứ duy nhất còn lại. */}
            <button
              type="button"
              onClick={() => {
                if (mode === 'docked' && !docked && window.matchMedia('(min-width: 64rem)').matches) toggleDock();
                else setDrawerOpen(true);
              }}
              aria-label={`Tiến độ khoá học ${pct}%, đã hoàn thành ${done}/${items.length} bài. Mở nội dung khoá học`}
              className={cn(headerBtn, 'h-11 shrink-0 gap-2 px-2 text-xs', showDock && 'lg:hidden')}
            >
              <Progress value={pct} aria-hidden className={cn('hidden w-16 sm:flex [&_[data-slot=progress-track]]:h-1.5', INK_TRACK)} />
              <span className="font-semibold tabular-nums">{pct}%</span>
              <span className="hidden text-ink-muted tabular-nums md:inline">
                · {done}/{items.length} bài
              </span>
            </button>
            <Link href="/my-learning" className={cn(headerBtn, 'hidden h-11 shrink-0 gap-1.5 px-2.5 text-sm font-medium sm:inline-flex')}>
              <Library className="text-ink-muted" aria-hidden />
              Học tập của tôi
            </Link>
            {/* Bài giảng có "Bài tiếp" ở dải dưới video; quiz / bài code đặt ở đây. Chỉ đi tới, quay lại dùng mục lục. */}
            {segment !== 'lecture' && nextHref && next && (
              <Link
                href={nextHref}
                title={`Bài tiếp: ${next.title}`}
                aria-label={`Bài tiếp: ${next.title}`}
                className={buttonVariants({ variant: 'outline', className: 'h-11 shrink-0' })}
              >
                Bài tiếp <ChevronRight data-icon="inline-end" />
              </Link>
            )}
          </div>
        </header>
        <div className="flex">
          {/* Thu gọn / mở có trượt: cột ngoài co giãn bề rộng (đẩy nội dung), ruột bề rộng cố định trượt ra/vào bằng
              translate. Thu gọn → inert (Tab không lọt vào phần đã ẩn). Drawer mode (quiz đang làm, bài code) không có cột. */}
          {mode === 'docked' && (
            <aside
              aria-label="Nội dung khoá học"
              inert={!docked}
              className={cn(
                'sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:block',
                docked ? 'w-88 xl:w-96' : 'w-0',
              )}
            >
              <div
                className={cn(
                  'flex h-full w-88 flex-col border-r bg-card transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none xl:w-96',
                  !docked && '-translate-x-full',
                )}
              >
                {progressBand(<h2 className="text-sm font-semibold">Nội dung khoá học</h2>)}
                <CourseOutline outline={outline} currentId={itemId} />
              </div>
            </aside>
          )}
          <div id="learn-main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
            {children}
          </div>
        </div>
        <CertificateDialog serial={cert.open} onClose={() => setCert((c) => ({ ...c, open: null }))} />
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" showCloseButton={false} className="max-w-[90vw] gap-0 p-0 data-[side=left]:w-96">
            <SheetClose
              render={<Button variant="ghost" size="icon" className="absolute top-1.5 right-1.5 z-10 size-11 text-ink-foreground hover:bg-ink-hover hover:text-white" aria-label="Đóng" />}
            >
              <X />
            </SheetClose>
            {/* Tiêu đề nằm trong dải tiến độ; pr-14 chừa nút đóng. */}
            <SheetHeader className="gap-0 p-0">
              {progressBand(<SheetTitle className="pr-12 text-ink-foreground">Nội dung khoá học</SheetTitle>)}
            </SheetHeader>
            <CourseOutline outline={outline} currentId={itemId} onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </ShellContext>
  );
}
