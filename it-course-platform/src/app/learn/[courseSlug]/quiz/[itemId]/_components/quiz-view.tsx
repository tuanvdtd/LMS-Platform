'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FileQuestion, Lock, TriangleAlert, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiMessage } from '@/lib/api/checkout';
import { apiErrorCode, getAttemptResult, getQuizOverview, startAttempt, submitAttempt } from '@/lib/api/learn-quiz';
import type { AttemptResult, AttemptSheet, QuizOverview, SubmitPayload } from '@/types/learn-quiz';
import { useLearnShell, useSidebarMode } from '../../../_components/learn-shell';
import { QuizResult } from './quiz-result';
import { clearSavedAttempt, QuizRunner } from './quiz-runner';
import { QuizStart, QuizStartSkeleton } from './quiz-start';

// key = attemptId trong URL ('' = màn tổng quan). Dữ liệu chỉ hiển thị khi key khớp URL hiện tại.
type Loaded =
  | { key: string; kind: 'overview'; overview: QuizOverview }
  | { key: string; kind: 'result'; result: AttemptResult }
  | { key: string; kind: 'error'; code?: string; message: string };

// Máy trạng thái: overview → running(sheet) → result. `?attempt=<id>` mở thẳng màn xem lại.
export default function QuizView({ courseSlug, itemId }: { courseSlug: string; itemId: string }) {
  const { markCompleted } = useLearnShell();
  const router = useRouter();
  const pathname = usePathname();
  const key = useSearchParams().get('attempt') ?? '';
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sheet, setSheet] = useState<AttemptSheet | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const skipFetch = useRef<string | null>(null); // kết quả vừa nộp đã có sẵn, không GET lại
  // Đang làm bài → mục lục thành ngăn trượt, nhường chỗ cho đề.
  useSidebarMode(sheet ? 'drawer' : 'docked');

  useEffect(() => {
    if (skipFetch.current === key) { skipFetch.current = null; return; }
    let cancelled = false;
    const req = key ? getAttemptResult(courseSlug, itemId, key) : getQuizOverview(courseSlug, itemId);
    req.then(
      (d) => {
        if (cancelled) return;
        if ('attempts' in d) { setTitle(d.title); setLoaded({ key, kind: 'overview', overview: d }); }
        else setLoaded({ key, kind: 'result', result: d });
      },
      (e) => { if (!cancelled) setLoaded({ key, kind: 'error', code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, itemId, key, reloadNonce]);

  async function start() {
    setBusy(true);
    try {
      setSheet(await startAttempt(courseSlug, itemId));
      if (key) router.replace(pathname);
    } catch (e) {
      if (apiErrorCode(e) === 'NOT_ENROLLED') setLoaded({ key, kind: 'error', code: 'NOT_ENROLLED', message: apiMessage(e) });
      else toast.error(apiMessage(e, 'Không bắt đầu được bài kiểm tra'));
    } finally {
      setBusy(false);
    }
  }

  async function submit(body: SubmitPayload) {
    if (!sheet) return;
    const { attemptId } = sheet;
    setBusy(true);
    try {
      const result = await submitAttempt(courseSlug, itemId, attemptId, body);
      clearSavedAttempt(attemptId);
      setLoaded({ key: attemptId, kind: 'result', result });
      setSheet(null);
      skipFetch.current = attemptId;
      router.replace(`${pathname}?attempt=${attemptId}`);
      window.scrollTo({ top: 0 });
      if (result.passed) {
        markCompleted(itemId);
        toast.success('Chúc mừng, bạn đã đạt bài kiểm tra!');
      }
    } catch (e) {
      if (apiErrorCode(e) === 'ATTEMPT_SUBMITTED') {
        // Lượt này đã nộp (tab khác) → mở kết quả của nó.
        clearSavedAttempt(attemptId);
        setSheet(null);
        router.replace(`${pathname}?attempt=${attemptId}`);
        toast.info('Lượt làm này đã được nộp trước đó');
      } else {
        toast.error(apiMessage(e, 'Nộp bài thất bại, đáp án vẫn được giữ — thử lại'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (sheet) {
    return <QuizRunner key={sheet.attemptId} title={title ?? 'Bài kiểm tra'} sheet={sheet} submitting={busy} onSubmit={submit} />;
  }
  if (!loaded || loaded.key !== key) return <QuizStartSkeleton />;

  if (loaded.kind === 'overview') {
    return <QuizStart courseSlug={courseSlug} overview={loaded.overview} starting={busy} onStart={start} />;
  }
  if (loaded.kind === 'result') {
    return <QuizResult courseSlug={courseSlug} itemId={itemId} title={title} result={loaded.result} starting={busy} onRetake={start} />;
  }

  const courseLink = (
    <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: key ? 'outline' : 'default' })}>Về khoá học</Link>
  );
  if (loaded.code === 'NOT_ENROLLED') {
    return (
      <StateMessage icon={Lock} title="Bạn chưa ghi danh khoá học này" text="Ghi danh khoá học để làm bài kiểm tra và theo dõi độ thành thạo.">
        <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: 'accent' })}>Xem khoá học</Link>
      </StateMessage>
    );
  }
  if (loaded.code === 'QUIZ_NOT_FOUND' || loaded.code === 'ATTEMPT_NOT_FOUND') {
    const attempt = loaded.code === 'ATTEMPT_NOT_FOUND';
    return (
      <StateMessage
        icon={FileQuestion}
        title={attempt ? 'Không tìm thấy lượt làm bài' : 'Không tìm thấy bài kiểm tra'}
        text={attempt ? 'Lượt này không tồn tại hoặc chưa được nộp.' : 'Bài kiểm tra không tồn tại hoặc chưa được xuất bản.'}
      >
        {attempt && <Link href={pathname} className={buttonVariants()}>Về tổng quan bài kiểm tra</Link>}
        {courseLink}
      </StateMessage>
    );
  }
  return (
    <StateMessage icon={TriangleAlert} title="Không tải được bài kiểm tra" text={loaded.message}>
      <Button onClick={() => { setLoaded(null); setReloadNonce((n) => n + 1); }}>Thử lại</Button>
      {courseLink}
    </StateMessage>
  );
}

function StateMessage({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </main>
  );
}
