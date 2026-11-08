import Link from 'next/link';
import { CircleCheck, CircleHelp, CircleMinus, CircleX, TrendingDown, TrendingUp, Minus, TriangleAlert } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { formatDuration, MASTERY_COLOR, MASTERY_LABEL, masteryLevel } from '@/lib/skills';
import { cn } from '@/lib/utils';
import type { AttemptResult } from '@/types/skills';
import { BACK_LINK } from './assessment-intro';

const MINUS = '−';
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${-n}` : '0');

// Nhãn + icon cho từng câu. Không bao giờ nói đáp án đúng là gì.
function itemStatus(it: AttemptResult['items'][number]) {
  if (it.isCorrect === null) return { label: 'Không tính', Icon: CircleHelp, tone: 'text-muted-foreground' };
  if (it.skipped) return { label: 'Bỏ qua', Icon: CircleMinus, tone: 'text-muted-foreground' };
  return it.isCorrect
    ? { label: 'Đúng', Icon: CircleCheck, tone: 'text-(--skill-strong)' }
    : { label: 'Sai', Icon: CircleX, tone: 'text-(--skill-weak)' };
}

export function AssessmentResult({ result }: { result: AttemptResult }) {
  const level = masteryLevel(result.pctAfter);
  const delta = result.pctBefore === null ? null : result.pctAfter - result.pctBefore;
  const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const eloDelta = result.ratingAfter - result.ratingBefore;
  const duration = formatDuration(Date.parse(result.finishedAt) - Date.parse(result.startedAt));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <section aria-labelledby="result-heading" className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 id="result-heading" className="text-sm font-medium text-muted-foreground">Kết quả đánh giá {result.topic.name}</h1>

        {result.answered === 0 ? (
          <p className="text-base font-medium text-foreground">Bạn chưa trả lời câu nào nên chưa có kết quả đo.</p>
        ) : (
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-3xl font-extrabold text-foreground sm:text-4xl">
          <span className="font-mono">
            {result.pctBefore === null ? `${result.pctAfter}%` : `${result.pctBefore}% → ${result.pctAfter}%`}
          </span>
          {delta !== null && DeltaIcon && (
            <span className="inline-flex items-center gap-1 text-xl">
              <DeltaIcon className={cn('size-5', delta > 0 && 'text-(--skill-strong)', delta < 0 && 'text-(--skill-weak)')} aria-hidden />
              ({signed(delta)})
            </span>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-2 text-xl">
            <span aria-hidden className="size-3 rounded-full" style={{ background: MASTERY_COLOR[level] }} />
            {MASTERY_LABEL[level]}
          </span>
        </p>
        )}

        <p className="text-sm text-muted-foreground">
          {result.answered === 0 ? duration : `Đúng ${result.correct}/${result.answered} · ${duration}`}
        </p>
        {result.answered > 0 && (
          <p className="text-xs text-muted-foreground/80">
            Điểm Elo: {result.ratingAfter} ({signed(eloDelta)})
          </p>
        )}

        {result.status === 'expired' && (
          <Alert className="mt-2 text-left">
            <TriangleAlert aria-hidden />
            <AlertTitle>Hết giờ — tính {result.answered} câu đã làm</AlertTitle>
          </Alert>
        )}

        <div className="mt-2 flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          <Link href="/skills" className={cn(buttonVariants(), 'h-11 w-full sm:w-auto')}>{BACK_LINK}</Link>
          <Link
            href={`/topic/${result.topic.slug}`}
            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Xem khoá học {result.topic.name}
          </Link>
        </div>
      </section>

      <section aria-labelledby="items-heading" className="mt-8 flex flex-col gap-3">
        <h2 id="items-heading" className="text-lg font-semibold text-foreground">Từng câu</h2>
        <ol className="flex flex-col gap-2">
          {result.items.map((it) => {
            const { label, Icon, tone } = itemStatus(it);
            return (
              <li key={it.position} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <span className="w-14 shrink-0 text-sm font-semibold text-foreground">Câu {it.position}</span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <Markdown className="line-clamp-2 max-h-12 overflow-hidden text-foreground">{it.stem.slice(0, 200)}</Markdown>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
                  <Icon className={cn('size-4', tone)} aria-hidden />
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
