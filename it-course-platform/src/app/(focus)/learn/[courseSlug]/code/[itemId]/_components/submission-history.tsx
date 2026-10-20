'use client';

import { History, LoaderCircle } from 'lucide-react';
import { VerdictBadge } from '@/components/shared/product-ui';
import { cn } from '@/lib/utils';
import { isGrading, LANGUAGES, type SubmissionSummary, verdictOf } from '@/types/exercise';

const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536e3], ['month', 2592e3], ['day', 86400], ['hour', 3600], ['minute', 60]];
function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'Vừa xong';
}
const fullTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

// 20 lần nộp gần nhất. Bấm một dòng → mở chi tiết ở khung Kết quả.
export function SubmissionHistory({
  history,
  selectedId,
  openingId,
  onOpen,
}: {
  history: SubmissionSummary[];
  selectedId: string | null;
  openingId: string | null;
  onOpen: (id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <History className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Chưa có lần nộp nào. Nộp bài để được chấm toàn bộ test.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2" aria-label="Lịch sử nộp bài">
      {history.map((s) => {
        const grading = isGrading(s.status);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpen(s.id)}
              aria-current={s.id === selectedId ? 'true' : undefined}
              aria-busy={s.id === openingId || undefined}
              className={cn(
                'flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-3 py-2 text-left transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                s.id === selectedId && 'border-primary/50 bg-(--primary-light) hover:bg-(--primary-light)',
              )}
            >
              <VerdictBadge verdict={verdictOf(s.status)} />
              {!grading && <span className="text-sm font-semibold text-foreground">{s.score} điểm</span>}
              {!grading && (
                <span className="text-sm text-muted-foreground">
                  {s.passedTests}/{s.totalTests} test
                </span>
              )}
              <span className="text-sm text-muted-foreground">{LANGUAGES[s.language]}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                {s.id === openingId && <LoaderCircle className="size-3.5 motion-safe:animate-spin" aria-hidden />}
                <time dateTime={s.submittedAt} title={fullTime(s.submittedAt)}>
                  {timeAgo(s.submittedAt)}
                </time>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
