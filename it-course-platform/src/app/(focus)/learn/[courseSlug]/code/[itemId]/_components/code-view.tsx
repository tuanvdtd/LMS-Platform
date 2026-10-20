'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileQuestion, Lock, TriangleAlert, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiMessage } from '@/lib/api/checkout';
import { getLearnExercise, getSubmission, listSubmissions, runCode, submitCode } from '@/lib/api/learn-exercise';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { cn } from '@/lib/utils';
import {
  isGrading,
  isInflight,
  type Language,
  LANGUAGES,
  type LearnExercise,
  type SubmissionDetail,
  type SubmissionSummary,
} from '@/types/exercise';
import { EditorPanel } from './editor-panel';
import { ProblemPanel } from './problem-panel';
import { ResultPanel, type ResultTab, type ShownResult } from './result-panel';

// Body 409 khi đã có bài đang chấm (có thể ở bài khác).
type InProgressError = {
  statusCode: 409;
  code: 'SUBMISSION_IN_PROGRESS';
  message: string;
  submissionId: string | null;
  itemId: string | null;
  courseSlug: string | null;
};

const langKey = (itemId: string) => `exercise:${itemId}:lang`;
const draftKey = (itemId: string, lang: Language) => `exercise:${itemId}:${lang}`;
function readStore(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStore(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage bị chặn/đầy: vẫn làm bài được, chỉ mất nháp */ }
}

const SPLIT = { min: 30, max: 70 };
const clampSplit = (v: number) => Math.min(SPLIT.max, Math.max(SPLIT.min, v));
const HEIGHT = 'md:h-[calc(100dvh-4rem-1px)]'; // trừ SiteHeader h-16 + viền

// Lịch sử giữ 20 bài mới nhất (như API); bài chưa có thì chèn theo thời gian nộp.
function upsert(list: SubmissionSummary[], s: SubmissionSummary) {
  if (list.some((x) => x.id === s.id)) return list.map((x) => (x.id === s.id ? s : x));
  return [...list, s].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 20);
}

// Không poll: lịch sử tải một lần khi vào trang; kết quả chấm lấy qua nút "Làm mới" / link thông báo (?submission=<id>).
export default function CodeView({ courseSlug, itemId }: { courseSlug: string; itemId: string }) {
  const router = useRouter();
  const submissionParam = useSearchParams().get('submission');
  const [exercise, setExercise] = useState<LearnExercise | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [history, setHistory] = useState<SubmissionSummary[]>([]);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ShownResult | null>(null);
  const [grading, setGrading] = useState<{ id: string } | null>(null);
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('tests');
  const [mobileTab, setMobileTab] = useState<'problem' | 'code'>('problem');
  const [split, setSplit] = useState(45);
  const [confirmLoad, setConfirmLoad] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLearnExercise(courseSlug, itemId), listSubmissions(courseSlug, itemId)]).then(
      ([ex, list]) => {
        if (cancelled) return;
        const saved = readStore(langKey(itemId));
        const lang = ex.languages.find((l) => l === saved) ?? ex.languages[0];
        setExercise(ex);
        setHistory(list);
        setLanguage(lang);
        setCode(readStore(draftKey(itemId, lang)) ?? ex.starters[lang] ?? '');
        const inflight = list[0] && isInflight(list[0]);
        setGrading(inflight ? { id: list[0].id } : null);
        if (inflight) setResultTab('result');
      },
      (e) => { if (!cancelled) setError({ code: apiErrorCode(e), message: apiMessage(e) }); },
    );
    return () => { cancelled = true; };
  }, [courseSlug, itemId, reloadNonce]);

  // Nháp theo ngôn ngữ; code trùng starter thì xoá nháp để nhận starter mới nếu giảng viên sửa.
  useEffect(() => {
    if (!exercise) return;
    writeStore(draftKey(itemId, language), code === (exercise.starters[language] ?? '') ? null : code);
  }, [exercise, itemId, language, code]);

  const applyDetail = useCallback((d: SubmissionDetail) => {
    setHistory((h) => upsert(h, d));
    setResultTab('result');
    setMobileTab('code');
    if (isGrading(d.status)) {
      setGrading({ id: d.id });
      return;
    }
    setGrading((g) => (g?.id === d.id ? null : g));
    setResult({ type: 'submission', submission: d });
    if (d.status !== 'internal_error') {
      setExercise((ex) => (ex && (ex.bestScore ?? -1) < d.score ? { ...ex, bestScore: d.score } : ex));
    }
  }, []);

  const ready = exercise !== null;
  useEffect(() => {
    if (!ready || !submissionParam) return;
    let cancelled = false;
    getSubmission(courseSlug, itemId, submissionParam).then(
      (d) => { if (!cancelled) applyDetail(d); },
      (e) => { if (!cancelled) toast.error(apiMessage(e, 'Không mở được bài nộp')); },
    );
    return () => { cancelled = true; };
  }, [ready, submissionParam, courseSlug, itemId, applyDetail]);

  // Bài Accepted mà bài tập chưa ghi nhận hoàn thành → tải lại để mở lời giải.
  const justAccepted =
    result?.type === 'submission' && result.submission.status === 'accepted' && exercise?.completed === false;
  useEffect(() => {
    if (!justAccepted) return;
    getLearnExercise(courseSlug, itemId).then(setExercise, () =>
      toast.error('Không tải lại được bài tập, tải lại trang để xem lời giải'),
    );
  }, [justAccepted, courseSlug, itemId]);

  if (!exercise) {
    if (!error) return <CodeViewSkeleton />;
    const courseLink = (
      <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: 'outline', className: 'h-11' })}>
        Về khoá học
      </Link>
    );
    if (error.code === 'NOT_ENROLLED') {
      return (
        <StateMessage icon={Lock} title="Bạn chưa ghi danh khoá học này" text="Ghi danh khoá học để làm bài tập và được chấm tự động.">
          <Link href={`/course/${courseSlug}`} className={buttonVariants({ variant: 'accent', className: 'h-11' })}>Xem khoá học</Link>
        </StateMessage>
      );
    }
    if (error.code === 'EXERCISE_NOT_FOUND') {
      return (
        <StateMessage icon={FileQuestion} title="Không tìm thấy bài tập" text="Bài tập không tồn tại hoặc chưa được xuất bản.">
          {courseLink}
        </StateMessage>
      );
    }
    return (
      <StateMessage icon={TriangleAlert} title="Không tải được bài tập" text={error.message}>
        <Button className="h-11" onClick={() => { setError(null); setReloadNonce((n) => n + 1); }}>Thử lại</Button>
        {courseLink}
      </StateMessage>
    );
  }

  const ex = exercise;
  const starterOf = (lang: Language) => ex.starters[lang] ?? '';
  const codeFor = (lang: Language) => (lang === language ? code : (readStore(draftKey(itemId, lang)) ?? starterOf(lang)));

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    setCode(codeFor(lang));
    writeStore(langKey(itemId), lang);
  }

  function loadCode(s: SubmissionDetail) {
    setLanguage(s.language);
    writeStore(langKey(itemId), s.language);
    setCode(s.sourceCode);
    setConfirmLoad(null);
  }

  function requestLoad(s: SubmissionDetail) {
    const current = codeFor(s.language);
    if (current === s.sourceCode || current === starterOf(s.language)) loadCode(s);
    else setConfirmLoad(s);
  }

  async function run() {
    setBusy('run');
    try {
      setResult({ type: 'run', run: await runCode(courseSlug, itemId, { language, sourceCode: code }) });
      setResultTab('result');
    } catch (e) {
      toast.error(apiMessage(e, 'Không chạy thử được, thử lại sau'));
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    setBusy('submit');
    try {
      const { id } = await submitCode(courseSlug, itemId, { language, sourceCode: code });
      setGrading({ id });
      setHistory((h) =>
        upsert(h, {
          id,
          language,
          status: 'pending',
          score: 0,
          passedTests: 0,
          totalTests: ex.publicTests.length + ex.hiddenTestCount,
          submittedAt: new Date().toISOString(),
          gradedAt: null,
        }),
      );
      setResultTab('result');
    } catch (e) {
      if (apiErrorCode(e) !== 'SUBMISSION_IN_PROGRESS') {
        toast.error(apiMessage(e, 'Nộp bài thất bại, thử lại sau'));
        return;
      }
      const body = (e as { response?: { data?: InProgressError } }).response?.data;
      if (body?.itemId === itemId) {
        if (body.submissionId) {
          setGrading({ id: body.submissionId });
          setResultTab('result');
        }
        toast.info('Bài nộp trước của bạn vẫn đang được chấm');
      } else {
        const href = body?.courseSlug && body.itemId ? `/learn/${body.courseSlug}/code/${body.itemId}` : null;
        toast.error('Bạn đang có bài chờ chấm ở bài khác', {
          description: 'Chờ bài đó chấm xong rồi nộp lại.',
          action: href ? { label: 'Mở bài đó', onClick: () => router.push(href) } : undefined,
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    if (!grading) return;
    setRefreshing(true);
    try {
      const d = await getSubmission(courseSlug, itemId, grading.id);
      applyDetail(d);
      if (isGrading(d.status)) toast.info('Bài vẫn đang được chấm, thử lại sau ít phút');
      else if (d.status === 'accepted') toast.success('Chúc mừng! Bài nộp đã Accepted');
    } catch (e) {
      toast.error(apiMessage(e, 'Không tải được kết quả, thử lại sau'));
    } finally {
      setRefreshing(false);
    }
  }

  async function openSubmission(id: string) {
    setOpeningId(id);
    try {
      applyDetail(await getSubmission(courseSlug, itemId, id));
    } catch (e) {
      toast.error(apiMessage(e, 'Không mở được bài nộp'));
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <main className={cn('flex flex-col', HEIGHT)}>
      <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'problem' | 'code')} className="border-b bg-card px-4 py-2 md:hidden">
        <TabsList className="w-full group-data-horizontal/tabs:h-11" aria-label="Chuyển giữa đề bài và code">
          <TabsTrigger value="problem">Đề bài</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row" style={{ '--split': `${split}%` } as React.CSSProperties}>
        <ProblemPanel
          courseSlug={courseSlug}
          exercise={ex}
          language={language}
          history={history}
          selectedId={result?.type === 'submission' ? result.submission.id : null}
          openingId={openingId}
          onOpenSubmission={openSubmission}
          className={cn('md:w-(--split) md:shrink-0', mobileTab !== 'problem' && 'max-md:hidden')}
        />

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Đổi độ rộng khung đề bài"
          aria-valuemin={SPLIT.min}
          aria-valuemax={SPLIT.max}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
            if (!rect || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
            setSplit(clampSplit(((e.clientX - rect.left) / rect.width) * 100));
          }}
          onKeyDown={(e) => {
            const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
            if (!step) return;
            e.preventDefault();
            setSplit((s) => clampSplit(s + step));
          }}
          className="hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-border transition-colors duration-150 outline-none hover:bg-primary/50 focus-visible:bg-primary md:block"
        />

        <div className={cn('flex min-w-0 flex-1 flex-col', mobileTab !== 'code' && 'max-md:hidden')}>
          <EditorPanel
            exercise={ex}
            language={language}
            onLanguageChange={changeLanguage}
            code={code}
            onCodeChange={setCode}
            onReset={() => setCode(starterOf(language))}
            busy={busy}
            grading={grading !== null}
            onRun={run}
            onSubmit={submit}
            className="md:flex-1"
          />
          <ResultPanel
            tab={resultTab}
            onTabChange={setResultTab}
            exercise={ex}
            grading={grading !== null}
            refreshing={refreshing}
            onRefresh={refresh}
            result={result}
            onLoadCode={requestLoad}
            className="border-t md:h-2/5 md:shrink-0"
          />
        </div>
      </div>

      <AlertDialog open={confirmLoad !== null} onOpenChange={(o) => !o && setConfirmLoad(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thay code trong editor?</AlertDialogTitle>
            <AlertDialogDescription>
              Code {confirmLoad && LANGUAGES[confirmLoad.language]} bạn đang viết sẽ bị thay bằng code của lần nộp này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Giữ code hiện tại</AlertDialogCancel>
            <Button onClick={() => confirmLoad && loadCode(confirmLoad)}>Nạp code</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function StateMessage({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children: React.ReactNode }) {
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

// Khớp bố cục: desktop chia đôi (đề | editor + kết quả), mobile tab Đề bài / Code.
export function CodeViewSkeleton() {
  return (
    <div className={cn('flex flex-col', HEIGHT)} role="status" aria-busy="true" aria-label="Đang tải bài tập">
      <div className="border-b bg-card px-4 py-2 md:hidden">
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-col md:w-[45%] md:shrink-0">
          <div className="flex h-11 items-center gap-5 border-b bg-card px-4 md:h-10">
            {[14, 12, 20, 16].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-7 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-2 h-5 w-20" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
        <div className="hidden w-1.5 shrink-0 bg-border md:block" />
        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <div className="flex items-center gap-2 border-b bg-card px-3 py-1.5">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="min-h-0 flex-1 p-2">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex justify-end gap-2 border-t bg-card px-3 py-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="flex h-2/5 shrink-0 flex-col border-t bg-card">
            <div className="flex h-10 items-center gap-5 border-b px-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
