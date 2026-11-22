'use client';

import { AlertTriangle, ArrowLeft, Check, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatCard } from '@/components/shared/product-ui';
import { AnalyticsQuizSkeleton } from '@/components/skeletons/analytics-quiz-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { flagText, fmtNum, fmtPct, fmtRatio } from '@/lib/analytics';
import { getQuizAnalytics } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import type { QuestionAnalytics, QuizAnalytics } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../../../_components/analytics-shell';
import { ItemStatusBadge } from '../../../../_components/status-badge';
import { useKeyed } from '../../../../_components/use-keyed';
import { ScoreHistogram } from './score-histogram';

type Filter = 'all' | 'fix' | 'review';
const FILTER_LABEL: Record<Filter, string> = { all: 'Tất cả', fix: 'Cần sửa', review: 'Nên xem' };

export function QuizAnalyticsView({ quizId }: { quizId: string }) {
  const { data, error } = useKeyed(quizId, getQuizAnalytics);
  const [filter, setFilter] = useState<Filter>('all');
  if (error) {
    return (
      <div className="flex-1 p-6">
        <AnalyticsEmpty icon={AlertTriangle} title="Không tìm thấy quiz">Quiz đã bị xoá hoặc không thuộc khoá của bạn.</AnalyticsEmpty>
      </div>
    );
  }
  if (!data) return <AnalyticsQuizSkeleton />;
  const { quiz, summary, minSample } = data;
  const count = (f: Filter) => (f === 'all' ? data.questions.length : data.questions.filter((q) => q.status === f).length);
  const shown = data.questions.filter((q) => filter === 'all' || q.status === filter);
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/instructor/analytics/assessments?course=${quiz.courseId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Chất lượng bài kiểm tra
        </Link>
        <h1 className="text-2xl font-extrabold text-balance text-foreground">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground">
          Lượt làm đầu tiên của {fmtNum(summary.n)} học viên · điểm đạt {quiz.passScorePct}%
        </p>
      </div>
      {summary.n < minSample && (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>
            Mới có {summary.n}/{minSample} lượt làm đầu tiên
          </AlertTitle>
          <AlertDescription>
            Số liệu từng câu chỉ để tham khảo nên dashboard chưa gắn cờ. Lớp nhỏ thì vài người làm sai cũng đủ đảo kết quả.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Điểm TB lượt đầu" value={fmtPct(summary.meanPct)} sub={`Trung vị ${fmtPct(summary.medianPct)}`} />
        <StatCard label="Đạt ngay lượt đầu" value={fmtPct(summary.passRateFirstPct)} />
        <StatCard label="Đạt sau cùng" value={fmtPct(summary.passRateFinalPct)} />
        <StatCard label="Số lượt TB đến khi đạt" value={summary.avgAttemptsToPass === null ? '—' : fmtNum(summary.avgAttemptsToPass)} />
        <StatCard label="Câu cần sửa / nên xem" value={`${count('fix')} / ${count('review')}`} />
      </div>
      <Panel title="Phân bố điểm lượt đầu" description={`Cột xanh: khoảng điểm từ ${quiz.passScorePct}% trở lên (đạt).`}>
        <ScoreHistogram bins={data.histogram} passPct={quiz.passScorePct} />
      </Panel>
      <Panel
        title="Từng câu hỏi"
        description="Trả lời đúng = độ khó. Độ phân biệt = tỉ lệ đúng của 27% học viên điểm cao trừ 27% điểm thấp (xếp theo điểm các câu còn lại)."
        action={
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="Lọc câu hỏi"
            value={[filter]}
            onValueChange={(v) => {
              const f = v[0] as Filter | undefined;
              if (f) setFilter(f);
            }}
          >
            {(['all', 'fix', 'review'] as const).map((f) => (
              <ToggleGroupItem key={f} value={f}>
                {FILTER_LABEL[f]} ({count(f)})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        {shown.length ? (
          <ol className="flex flex-col gap-3">
            {shown.map((q) => (
              <QuestionCard key={q.id} q={q} quiz={quiz} />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Không có câu nào ở mục này.</p>
        )}
      </Panel>
    </div>
  );
}

function QuestionCard({ q, quiz }: { q: QuestionAnalytics; quiz: QuizAnalytics['quiz'] }) {
  const optionText = (id?: string) => q.options.find((o) => o.id === id)?.content;
  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="font-mono text-sm text-muted-foreground">#{q.position + 1}</span>
        <p className="line-clamp-2 min-w-0 flex-1 font-medium text-foreground">{q.stem}</p>
        <ItemStatusBadge status={q.status} />
        <Link
          href={`/instructor/courses/${quiz.courseId}/manage/quizzes/${quiz.itemId}?question=${q.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Pencil className="size-3.5" aria-hidden />
          Sửa câu
        </Link>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Lượt</dt>
          <dd className="font-mono">{q.n}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Trả lời đúng</dt>
          <dd className="font-mono">{q.p === null ? '—' : fmtPct(q.p * 100)}</dd>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <dt className="text-muted-foreground">Độ phân biệt</dt>
          <dd className="font-mono">
            {fmtRatio(q.d)}
            {q.d !== null && q.dSe !== null && <span className="text-muted-foreground"> ± {fmtRatio(q.dSe)}</span>}
          </dd>
          {q.pUpper !== null && q.pLower !== null && (
            <dd className="text-muted-foreground">
              (nhóm cao đúng {fmtPct(q.pUpper * 100)} · nhóm thấp đúng {fmtPct(q.pLower * 100)})
            </dd>
          )}
        </div>
        {q.relatedItem && (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Bài giảng liên quan</dt>
            <dd>{q.relatedItem.title}</dd>
          </div>
        )}
      </dl>
      <ul className="flex flex-col gap-1.5" aria-label="Tỉ lệ chọn từng phương án">
        {q.options.map((o) => (
          <li key={o.id} className="grid grid-cols-[1fr_minmax(6rem,12rem)_4.5rem] items-center gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              {o.isCorrect ? <Check className="size-4 shrink-0 text-success" aria-label="Đáp án đúng" /> : <span className="size-4 shrink-0" aria-hidden />}
              <span className="truncate">{o.content}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-secondary">
              <span className={cn('block h-full', o.isCorrect ? 'bg-success' : 'bg-muted-foreground/50')} style={{ width: `${o.pickedPct}%` }} />
            </span>
            <span className="text-right font-mono text-xs">{fmtPct(o.pickedPct)}</span>
          </li>
        ))}
      </ul>
      {q.flags.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md bg-muted p-3 text-sm">
          {q.flags.map((f) => (
            <li key={f.code + (f.optionId ?? '')} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              {flagText(f.code, optionText(f.optionId))}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
