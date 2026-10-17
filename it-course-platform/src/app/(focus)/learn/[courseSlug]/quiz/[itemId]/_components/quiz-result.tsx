import Link from 'next/link';
import { BookOpen, ChevronLeft, CircleCheck, CircleX, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AttemptResult, ResultQuestion } from '@/types/learn-quiz';

// Đạt/chưa đạt: màu + icon + chữ (không chỉ màu). Chữ dùng foreground để đủ tương phản.
export function PassBadge({ passed, labels = ['Đạt', 'Chưa đạt'] }: { passed: boolean; labels?: [string, string] }) {
  const Icon = passed ? CircleCheck : CircleX;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold text-foreground',
        passed ? 'border-(--skill-strong) bg-(--skill-strong-bg)' : 'border-(--skill-weak) bg-(--skill-weak-bg)',
      )}
    >
      <Icon className={cn('size-4', passed ? 'text-(--skill-strong)' : 'text-(--skill-weak)')} aria-hidden />
      {passed ? labels[0] : labels[1]}
    </span>
  );
}

const level = (pct: number) => (pct < 40 ? 'weak' : pct < 70 ? 'mid' : 'strong');
const LEVEL_BAR = {
  weak: '[&_[data-slot=progress-indicator]]:bg-(--skill-weak)',
  mid: '[&_[data-slot=progress-indicator]]:bg-(--skill-mid)',
  strong: '[&_[data-slot=progress-indicator]]:bg-(--skill-strong)',
} as const;
const LEVEL_LABEL = { weak: 'Yếu', mid: 'Trung bình', strong: 'Vững' } as const;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m} phút ${s} giây` : `${s} giây`;
}

export function QuizResult({
  courseSlug,
  itemId,
  title,
  result,
  starting,
  onRetake,
}: {
  courseSlug: string;
  itemId: string;
  title: string | null;
  result: AttemptResult;
  starting: boolean;
  onRetake: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link href={`/learn/${courseSlug}/quiz/${itemId}`} className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Tổng quan bài kiểm tra
      </Link>

      <section aria-labelledby="result-heading" className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 id="result-heading" className="text-sm font-medium text-muted-foreground">
          {title ? `${title} · ` : ''}Kết quả lần {result.attemptNo}
        </h1>
        <p className="font-mono text-5xl font-extrabold text-foreground sm:text-6xl">{result.scorePct}%</p>
        <PassBadge passed={result.passed} labels={['Đạt yêu cầu', 'Chưa đạt']} />
        <p className="text-sm text-muted-foreground">
          Đúng {result.correctCount}/{result.total} · Điểm đạt {result.passScorePct}% · {formatDuration(result.timeSpentSec)}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button className="h-11" disabled={starting} onClick={onRetake}>
            <RotateCcw data-icon="inline-start" aria-hidden /> {starting ? 'Đang mở…' : 'Làm lại'}
          </Button>
          <Link href={`/course/${courseSlug}`} className={cn(buttonVariants({ variant: 'outline' }), 'h-11')}>
            <BookOpen data-icon="inline-start" aria-hidden /> Về khoá học
          </Link>
        </div>
      </section>

      {result.topics.length > 0 && (
        <section aria-labelledby="mastery-heading" className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <h2 id="mastery-heading" className="text-lg font-semibold text-foreground">Độ thành thạo theo kỹ năng</h2>
          <ul className="flex flex-col gap-3">
            {result.topics.map((t) => {
              const lv = level(t.masteryPct);
              return (
                <li key={t.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-foreground">{t.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {LEVEL_LABEL[lv]} · <span className="font-mono font-semibold text-foreground">{Math.round(t.masteryPct)}%</span>
                    </span>
                  </div>
                  <Progress value={t.masteryPct} aria-label={`${t.name}: ${Math.round(t.masteryPct)}%`} className={LEVEL_BAR[lv]} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="review-heading" className="mt-8 flex flex-col gap-4">
        <h2 id="review-heading" className="text-lg font-semibold text-foreground">Xem lại từng câu</h2>
        <ol className="flex flex-col gap-4">
          {result.questions.map((q, i) => <ReviewQuestion key={q.id} q={q} index={i} />)}
        </ol>
      </section>
    </main>
  );
}

function ReviewQuestion({ q, index }: { q: ResultQuestion; index: number }) {
  const Icon = q.isCorrect ? CircleCheck : CircleX;
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Câu {index + 1}</span>
        <span className="inline-flex items-center gap-1 text-sm text-foreground">
          <Icon className={cn('size-4', q.isCorrect ? 'text-(--skill-strong)' : 'text-(--skill-weak)')} aria-hidden />
          {q.isCorrect ? 'Đúng' : q.selectedOptionIds.length ? 'Sai' : 'Chưa trả lời'}
        </span>
        <Badge variant="secondary">{q.type === 'multiple_choice' ? 'Chọn nhiều' : 'Chọn 1'}</Badge>
      </div>
      <Markdown className="text-base text-foreground">{q.stem}</Markdown>
      <ul className="flex flex-col gap-2">
        {q.options.map((o) => {
          const picked = q.selectedOptionIds.includes(o.id);
          const tone = o.isCorrect ? 'strong' : picked ? 'weak' : null;
          return (
            <li
              key={o.id}
              className={cn(
                'flex flex-col gap-2 rounded-lg border-2 p-3',
                tone === 'strong' && 'border-(--skill-strong) bg-(--skill-strong-bg)',
                tone === 'weak' && 'border-(--skill-weak) bg-(--skill-weak-bg)',
                !tone && 'border-border',
              )}
            >
              <div className="flex items-start gap-2">
                {o.isCorrect
                  ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-(--skill-strong)" aria-hidden />
                  : picked
                    ? <CircleX className="mt-0.5 size-4 shrink-0 text-(--skill-weak)" aria-hidden />
                    : <span className="mt-0.5 size-4 shrink-0" aria-hidden />}
                <Markdown className="min-w-0 flex-1 text-foreground">{o.content}</Markdown>
              </div>
              {(o.isCorrect || picked) && (
                <p className="pl-6 text-xs font-semibold text-foreground">
                  {[picked && 'Bạn chọn', o.isCorrect && 'Đáp án đúng'].filter(Boolean).join(' · ')}
                </p>
              )}
              {o.explanation && (
                <div className="ml-6 rounded-md bg-background/70 p-2">
                  <span className="sr-only">Giải thích: </span>
                  <Markdown className="text-muted-foreground">{o.explanation}</Markdown>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {q.relatedItem && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BookOpen className="size-4 shrink-0" aria-hidden /> Bài giảng liên quan: <span className="font-medium text-foreground">{q.relatedItem.title}</span>
        </p>
      )}
    </li>
  );
}
