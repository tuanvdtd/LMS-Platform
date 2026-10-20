// it-course-platform/src/app/learn/[courseSlug]/_components/learn-shell.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, FileQuestion, Lock, PanelRight, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProgressRing } from '@/components/shared/product-ui';
import { LearnShellSkeleton } from '@/components/skeletons/learn-shell-skeleton';
import { apiMessage } from '@/lib/api/checkout';
import { getOutline, setLastItem } from '@/lib/api/learn';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { cn } from '@/lib/utils';
import type { LearnItem, LearnOutline } from '@/types/learn';
import { CourseOutline } from './course-outline';
import { flatItems, itemHref, neighbors } from './learn-nav';
import { StateMessage } from './state-message';

type SidebarMode = 'docked' | 'drawer';
type Shell = {
  outline: LearnOutline;
  markCompleted: (itemId: string, progressPct?: number) => void;
  setSidebarMode: (mode: SidebarMode) => void;
};

const ShellContext = createContext<Shell | null>(null);

export function useLearnShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useLearnShell phải nằm trong LearnShell');
  return ctx;
}

// Trang con khai báo chế độ mục lục (L1): bài giảng / màn quiz thường = docked; đang làm quiz, bài code = drawer.
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

// Khung học chung (spec 2026-10-20-lecture-player §7.2): tải mục lục một lần, giữ khi chuyển bài.
export function LearnShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ courseSlug: string; itemId: string }>();
  const courseSlug = params.courseSlug;
  const itemId: string | undefined = params.itemId; // /learn/<slug> không có itemId
  const [outline, setOutline] = useState<LearnOutline | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [mode, setMode] = useState<SidebarMode>('docked');
  const [docked, setDocked] = useState(readDocked);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOutline(courseSlug).then(
      (o) => { if (!cancelled) setOutline(o); },
      (e) => { if (!cancelled) setError({ code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, nonce]);

  // Ghi bài đang học cho "Tiếp tục học" (spec §5); lỗi bỏ qua.
  const ready = outline !== null;
  useEffect(() => {
    if (ready && itemId) setLastItem(courseSlug, itemId).catch(() => undefined);
  }, [ready, courseSlug, itemId]);

  const markCompleted = useCallback(
    (id: string, progressPct?: number) => {
      setOutline((o) =>
        o && {
          ...o,
          progressPct: progressPct ?? o.progressPct,
          sections: o.sections.map((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, completed: true } : i)) })),
        },
      );
      // Quiz/code không trả % → tải lại mục lục để lấy % thật.
      if (progressPct === undefined) getOutline(courseSlug).then(setOutline, () => undefined);
    },
    [courseSlug],
  );

  const ctx = useMemo(() => (outline ? { outline, markCompleted, setSidebarMode: setMode } : null), [outline, markCompleted]);

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
  const done = items.filter((i) => i.completed).length;
  const { prev, next } = neighbors(outline, itemId);
  const showDock = mode === 'docked' && docked;
  const toggleDock = () => {
    setDocked((d) => {
      try { localStorage.setItem(DOCK_KEY, d ? '0' : '1'); } catch { /* storage bị chặn: chỉ không nhớ lựa chọn */ }
      return !d;
    });
  };

  return (
    <ShellContext value={ctx}>
      <div className="min-h-dvh bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 sm:gap-3 sm:px-4">
          <Link href="/" aria-label="SkillPath — trang chủ" className="flex shrink-0 items-center gap-1.5 rounded-md text-sm font-bold text-primary">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">SkillPath</span>
          </Link>
          <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
          <Link href={`/course/${outline.course.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:underline">
            {outline.course.title}
          </Link>
          <div className="flex shrink-0 items-center gap-2" aria-label={`Đã hoàn thành ${done}/${items.length} bài`}>
            <ProgressRing progress={Math.round(outline.progressPct)} size={36} />
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">{done}/{items.length} bài</span>
          </div>
          <nav aria-label="Chuyển bài" className="flex shrink-0 items-center">
            <NavButton slug={outline.course.slug} item={prev} label="Bài trước" icon={ChevronLeft} />
            <NavButton slug={outline.course.slug} item={next} label="Bài tiếp" icon={ChevronRight} />
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-11 shrink-0', mode === 'docked' && 'lg:hidden')}
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở nội dung khoá học"
          >
            <PanelRight />
          </Button>
          {mode === 'docked' && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden size-11 shrink-0 lg:inline-flex"
              onClick={toggleDock}
              aria-pressed={docked}
              aria-label={docked ? 'Ẩn nội dung khoá học' : 'Hiện nội dung khoá học'}
            >
              <PanelRight />
            </Button>
          )}
        </header>
        <div className="flex">
          <div className="min-w-0 flex-1">{children}</div>
          {showDock && (
            <aside aria-label="Nội dung khoá học" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-80 shrink-0 flex-col border-l bg-card lg:flex">
              <h2 className="border-b px-4 py-3 text-sm font-semibold text-foreground">Nội dung khoá học</h2>
              <CourseOutline outline={outline} currentId={itemId} />
            </aside>
          )}
        </div>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-[22rem] max-w-[90vw] gap-0 p-0">
            <SheetHeader className="border-b">
              <SheetTitle>Nội dung khoá học</SheetTitle>
            </SheetHeader>
            <CourseOutline outline={outline} currentId={itemId} onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </ShellContext>
  );
}

function NavButton({
  slug,
  item,
  label,
  icon: Icon,
}: {
  slug: string;
  item: LearnItem | null;
  label: string;
  icon: typeof ChevronLeft;
}) {
  const href = item && itemHref(slug, item);
  if (!href) {
    return (
      <Button variant="ghost" size="icon" className="size-11" disabled aria-label={label}>
        <Icon />
      </Button>
    );
  }
  return (
    <Link href={href} aria-label={`${label}: ${item.title}`} title={item.title} className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'size-11' })}>
      <Icon />
    </Link>
  );
}
