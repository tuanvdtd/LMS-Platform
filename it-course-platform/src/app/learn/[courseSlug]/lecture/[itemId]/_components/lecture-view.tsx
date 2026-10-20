// …/_components/lecture-view.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CircleCheck, FileQuestion, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LearnLectureSkeleton } from '@/components/skeletons/learn-lecture-skeleton';
import { apiMessage } from '@/lib/api/checkout';
import { completeLecture, getLecture } from '@/lib/api/learn';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import type { LearnItem, Lecture } from '@/types/learn';
import { itemHref, neighbors } from '../../../_components/learn-nav';
import { useLearnShell, useSidebarMode } from '../../../_components/learn-shell';
import { StateMessage } from '../../../_components/state-message';
import { LectureNotes } from './lecture-notes';
import { LectureResources } from './lecture-resources';
import { PdfViewer } from './pdf-viewer';
import { VideoPlayer } from './video-player';

// Trang bài giảng (spec 2026-10-20-lecture-player §7.3). Page key theo itemId → state mới mỗi bài.
export default function LectureView({ courseSlug, itemId }: { courseSlug: string; itemId: string }) {
  useSidebarMode('docked');
  const { outline, markCompleted } = useLearnShell();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [completing, setCompleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    getLecture(courseSlug, itemId).then(
      (l) => { if (!cancelled) setLecture(l); },
      (e) => { if (!cancelled) setError({ code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, itemId, nonce]);

  const markDone = useCallback(
    (progressPct: number) => {
      setLecture((l) => l && { ...l, progress: { ...l.progress, completed: true } });
      markCompleted(itemId, progressPct);
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
      toast.success('Đã đánh dấu hoàn thành');
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

  const { prev, next } = neighbors(outline, itemId);
  return (
    <main className="pb-12">
      {lecture.lectureKind === 'video' ? (
        <VideoPlayer courseSlug={courseSlug} lecture={lecture} videoRef={videoRef} onCompleted={markDone} onRefreshUrl={refreshUrl} />
      ) : (
        <PdfViewer lecture={lecture} onRefreshUrl={refreshUrl} />
      )}
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <StepLink slug={courseSlug} item={prev} dir="prev" />
        {lecture.progress.completed ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-500">
            <CircleCheck className="size-4" aria-hidden /> Đã hoàn thành
          </span>
        ) : lecture.manualComplete ? (
          <Button className="h-11" onClick={complete} disabled={completing}>
            <CircleCheck data-icon="inline-start" />
            {lecture.lectureKind === 'document' ? 'Đánh dấu đã đọc' : 'Đánh dấu hoàn thành'}
          </Button>
        ) : (
          <span className="text-center text-xs text-muted-foreground">Tự hoàn thành khi xem đủ 90%</span>
        )}
        <StepLink slug={courseSlug} item={next} dir="next" />
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 pt-5">
        <h1 className="text-xl font-bold text-pretty text-foreground sm:text-2xl">{lecture.title}</h1>
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            {lecture.resources.length > 0 && <TabsTrigger value="resources">Tài liệu ({lecture.resources.length})</TabsTrigger>}
            <TabsTrigger value="notes">Ghi chú</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            {lecture.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{lecture.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Bài giảng chưa có mô tả.</p>
            )}
          </TabsContent>
          {lecture.resources.length > 0 && (
            <TabsContent value="resources" className="pt-4">
              <LectureResources courseSlug={courseSlug} resources={lecture.resources} />
            </TabsContent>
          )}
          <TabsContent value="notes" keepMounted className="pt-4">
            <LectureNotes courseSlug={courseSlug} itemId={itemId} videoRef={lecture.lectureKind === 'video' ? videoRef : null} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function StepLink({ slug, item, dir }: { slug: string; item: LearnItem | null; dir: 'prev' | 'next' }) {
  const href = item && itemHref(slug, item);
  const label = dir === 'prev' ? 'Bài trước' : 'Bài tiếp';
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  if (!href) return <span className="w-24" aria-hidden />;
  return (
    <Link href={href} title={item.title} aria-label={`${label}: ${item.title}`} className={buttonVariants({ variant: 'outline', className: 'h-11' })}>
      {dir === 'prev' && <Icon data-icon="inline-start" />}
      <span className="hidden sm:inline">{label}</span>
      {dir === 'next' && <Icon data-icon="inline-end" />}
    </Link>
  );
}
