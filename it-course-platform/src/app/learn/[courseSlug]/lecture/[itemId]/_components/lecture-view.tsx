// …/_components/lecture-view.tsx
'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, CircleCheck, CircleDashed, FileQuestion, RotateCcw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LearnLectureSkeleton } from '@/components/skeletons/learn-lecture-skeleton';
import { apiMessage } from '@/lib/api/checkout';
import { completeLecture, getLecture } from '@/lib/api/learn';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { formatDuration } from '@/types/curriculum';
import type { LearnItem, LearnOutline, Lecture } from '@/types/learn';
import { kindOf } from '../../../_components/course-outline';
import { flatItems, itemHref, neighbors } from '../../../_components/learn-nav';
import { useLearnShell, useSidebarMode } from '../../../_components/learn-shell';
import { StateMessage } from '../../../_components/state-message';
import { LectureNotes } from './lecture-notes';
import { LectureQa } from './lecture-qa';
import { LectureResources } from './lecture-resources';
import { PdfViewer } from './pdf-viewer';
import { VideoPlayer } from './video-player';

const PANEL = 'max-w-2xl focus-visible:ring-0';

// "Phần 2: Xây API · Bài 5" — vị trí của một bài trong mục lục.
function placeOf(outline: LearnOutline, id: string) {
  const si = outline.sections.findIndex((s) => s.items.some((i) => i.id === id));
  const n = flatItems(outline).findIndex((i) => i.id === id) + 1;
  return si < 0 ? `Bài ${n}` : `Phần ${si + 1}: ${outline.sections[si].title} · Bài ${n}`;
}

// Trang bài giảng: video / PDF → dải bài học (tên, vị trí, trạng thái, chuyển bài) → tab dính khi cuộn.
// Page key theo itemId → state mới mỗi bài.
export default function LectureView({ courseSlug, itemId }: { courseSlug: string; itemId: string }) {
  useSidebarMode('docked');
  const { outline, markCompleted } = useLearnShell();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    getLecture(courseSlug, itemId).then(
      (l) => { if (!cancelled) setLecture(l); },
      (e) => { if (!cancelled) setError({ code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, itemId, nonce]);

  // Một chỗ báo hoàn thành cho cả tự hoàn thành (xem đủ 90%) lẫn bấm tay.
  const markDone = useCallback(
    (progressPct: number) => {
      setLecture((l) => l && { ...l, progress: { ...l.progress, completed: true } });
      markCompleted(itemId, progressPct);
      const pct = Math.round(progressPct);
      if (pct >= 100) toast.success('Bạn đã hoàn thành toàn bộ khoá học');
      else toast.success('Đã hoàn thành bài này', { description: `Tiến độ khoá học: ${pct}%` });
    },
    [itemId, markCompleted],
  );

  // Link ký hết hạn → lấy bản mới (giữ progress từ server).
  const refreshUrl = useCallback(
    () => getLecture(courseSlug, itemId).then((l) => { setLecture(l); return l.mediaUrl; }),
    [courseSlug, itemId],
  );

  async function complete() {
    setCompleting(true);
    try {
      markDone((await completeLecture(courseSlug, itemId)).progressPct);
    } catch (e) {
      toast.error(apiMessage(e, 'Không đánh dấu được, thử lại'));
    } finally {
      setCompleting(false);
    }
  }

  if (!lecture) {
    if (!error) return <LearnLectureSkeleton />;
    if (error.code === 'LECTURE_NOT_FOUND') {
      return <StateMessage icon={FileQuestion} title="Không tìm thấy bài giảng" text="Bài giảng không tồn tại hoặc chưa được xuất bản." />;
    }
    return (
      <StateMessage icon={TriangleAlert} title="Không tải được bài giảng" text={error.message}>
        <Button className="h-11" onClick={() => { setError(null); setNonce((n) => n + 1); }}>Thử lại</Button>
      </StateMessage>
    );
  }

  const { next } = neighbors(outline, itemId);
  const isVideo = lecture.lectureKind === 'video';
  return (
    <main>
      {isVideo ? (
        <VideoPlayer
          courseSlug={courseSlug}
          lecture={lecture}
          videoRef={videoRef}
          onCompleted={markDone}
          onRefreshUrl={refreshUrl}
          onEndedChange={setEnded}
        >
          {ended && <UpNext outline={outline} next={next} videoRef={videoRef} />}
        </VideoPlayer>
      ) : (
        <PdfViewer lecture={lecture} onRefreshUrl={refreshUrl} />
      )}

      {/* Trạng thái thuộc về bài (chip cạnh dòng vị trí), cụm bên phải chỉ để hành động + chuyển bài. */}
      <div className="flex flex-col gap-3 border-b bg-card px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="text-lg font-bold text-balance text-foreground sm:text-xl">{lecture.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span>
              {placeOf(outline, itemId)} ·{' '}
              {isVideo ? <span className="font-mono tabular-nums">{formatDuration(lecture.durationSec)}</span> : 'Tài liệu PDF'}
            </span>
            {lecture.progress.completed ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-success-soft px-2.5 font-semibold text-success">
                <CircleCheck className="size-3.5" aria-hidden /> Đã hoàn thành
              </span>
            ) : (
              !lecture.manualComplete && (
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2.5 font-medium text-secondary-foreground">
                  <CircleDashed className="size-3.5" aria-hidden /> Xem đủ 90% để hoàn thành
                </span>
              )
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {!lecture.progress.completed && lecture.manualComplete && (
            <Button className="mr-auto h-11 md:mr-0" onClick={complete} disabled={completing}>
              <CircleCheck data-icon="inline-start" />
              {isVideo ? 'Đánh dấu hoàn thành' : 'Đánh dấu đã đọc'}
            </Button>
          )}
          <NextLink slug={courseSlug} item={next} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="gap-0">
        {/* Dính dưới header khi cuộn: đọc hỏi đáp dài vẫn đổi tab được. Cao 52px → mỗi tab ≥ 44px. */}
        {/* bg-card liền mặt với header + dải bài học (theme tối background ≠ card). Đệm px-px / sm:px-2.25 + 3px của
            TabsList + 12px của tab = 16 / 24px → chữ tab đầu thẳng hàng tên bài (px-4 / sm:px-6). */}
        <div className="sticky top-14 z-20 border-b bg-card px-px sm:px-2.25">
          <TabsList variant="line" className="group-data-horizontal/tabs:h-13">
            <TabsTrigger value="overview" className="px-3">Tổng quan</TabsTrigger>
            {lecture.resources.length > 0 && (
              <TabsTrigger value="resources" className="px-3">
                Tài liệu <span className="tabular-nums text-muted-foreground">{lecture.resources.length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notes" className="px-3">Ghi chú</TabsTrigger>
            <TabsTrigger value="qa" className="px-3">Hỏi đáp</TabsTrigger>
          </TabsList>
        </div>
        {/* tabIndex -1: bấm chuột vào vùng nội dung rồi nhấn phím không vẽ viền focus quanh cả panel. Người dùng bàn
            phím đi từ thanh tab thẳng vào ô ghi chú / hỏi đáp / nút tải bên trong. */}
        <div className="px-4 pt-6 pb-16 sm:px-6">
          <TabsContent value="overview" tabIndex={-1} className={PANEL}>
            {lecture.description ? (
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{lecture.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Giảng viên chưa viết mô tả cho bài này.</p>
            )}
          </TabsContent>
          {lecture.resources.length > 0 && (
            <TabsContent value="resources" tabIndex={-1} className={PANEL}>
              <LectureResources courseSlug={courseSlug} resources={lecture.resources} />
            </TabsContent>
          )}
          <TabsContent value="notes" keepMounted tabIndex={-1} className={PANEL}>
            <LectureNotes courseSlug={courseSlug} itemId={itemId} videoRef={isVideo ? videoRef : null} />
          </TabsContent>
          <TabsContent value="qa" keepMounted tabIndex={-1} className={PANEL}>
            <LectureQa courseSlug={courseSlug} itemId={itemId} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}

// Chỉ có "Bài tiếp" (quay lại bài trước dùng mục lục). Bài cuối → không hiện.
function NextLink({ slug, item }: { slug: string; item: LearnItem | null }) {
  const href = item && itemHref(slug, item);
  if (!href) return null;
  return (
    <Link href={href} title={`Bài tiếp: ${item.title}`} aria-label={`Bài tiếp: ${item.title}`} className={buttonVariants({ variant: 'outline', className: 'h-11' })}>
      Bài tiếp <ChevronRight data-icon="inline-end" />
    </Link>
  );
}

// Hết video: gợi ý bài tiếp (bấm mới chuyển, không tự phát) hoặc báo đã tới bài cuối.
function UpNext({ outline, next, videoRef }: { outline: LearnOutline; next: LearnItem | null; videoRef: RefObject<HTMLVideoElement | null> }) {
  const href = next && itemHref(outline.course.slug, next);
  const items = flatItems(outline);
  const done = items.filter((i) => i.completed).length;
  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play();
  };
  const kind = next && kindOf(next);
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-ink/90 px-6 text-center text-ink-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      {href && kind ? (
        <>
          <div className="flex max-w-xl flex-col gap-1.5">
            <p className="text-base font-semibold text-balance sm:text-xl">Bài tiếp: {next.title}</p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-ink-muted">
              <kind.icon className="size-4" aria-hidden /> {placeOf(outline, next.id)} · {kind.label}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {/* Không autoFocus: người học có thể đang gõ ghi chú khi video hết. */}
            <Link href={href} className={buttonVariants({ className: 'h-11' })}>
              Học bài tiếp <ChevronRight data-icon="inline-end" />
            </Link>
            <ReplayButton onClick={replay} />
          </div>
        </>
      ) : (
        <>
          <div className="flex max-w-xl flex-col gap-1.5">
            <p className="text-base font-semibold text-balance sm:text-xl">Đây là bài cuối của khoá học</p>
            <p className="text-sm text-ink-muted tabular-nums">
              Đã hoàn thành {done}/{items.length} bài
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/my-learning" className={buttonVariants({ className: 'h-11' })}>
              Học tập của tôi
            </Link>
            <ReplayButton onClick={replay} />
          </div>
        </>
      )}
    </div>
  );
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="h-11 border-ink-border bg-transparent text-ink-foreground hover:bg-ink-hover hover:text-white"
      onClick={onClick}
    >
      <RotateCcw data-icon="inline-start" /> Xem lại
    </Button>
  );
}
