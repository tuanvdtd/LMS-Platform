'use client';

import { FileInput, LoaderCircle, RefreshCw } from 'lucide-react';
import { VerdictBadge } from '@/components/shared/product-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  LANGUAGES,
  type LearnExercise,
  type RunResult,
  type SubmissionDetail,
  type SubmissionStatus,
  verdictOf,
} from '@/types/exercise';

export type ResultTab = 'tests' | 'result';
export type ShownResult = { type: 'run'; run: RunResult } | { type: 'submission'; submission: SubmissionDetail };

export const PANEL_TABS = 'w-full justify-start overflow-x-auto overflow-y-hidden group-data-horizontal/tabs:h-11 md:group-data-horizontal/tabs:h-10';
export const formatMs = (ms: number | null) => (ms === null ? '–' : `${ms.toLocaleString('vi-VN')} ms`);
export const formatKb = (kb: number | null) => (kb === null ? '–' : `${(kb / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`);

export function IoBlock({ label, value, tone }: { label: string; value: string; tone?: 'error' }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <pre
        className={cn(
          'max-h-40 overflow-auto rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs break-all whitespace-pre-wrap text-foreground',
          tone === 'error' && 'text-destructive',
        )}
      >
        {value || <span className="text-muted-foreground italic">(trống)</span>}
      </pre>
    </div>
  );
}

function TestCard({
  label,
  status,
  timeMs,
  io,
}: {
  label: string;
  status: SubmissionStatus;
  timeMs: number | null;
  io?: { input: string; expectedOutput: string; stdout: string; stderr: string };
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <VerdictBadge verdict={verdictOf(status)} />
        <span className="ml-auto font-mono text-xs text-muted-foreground">{formatMs(timeMs)}</span>
      </div>
      {io && (
        <div className="grid gap-2 sm:grid-cols-2">
          <IoBlock label="Input" value={io.input} />
          <IoBlock label="Output mong đợi" value={io.expectedOutput} />
          <IoBlock label="Output của bạn" value={io.stdout} />
          {io.stderr && <IoBlock label="stderr" value={io.stderr} tone="error" />}
        </div>
      )}
    </li>
  );
}

function CompileError({ text, badge }: { text: string; badge?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      {badge && <VerdictBadge verdict="CE" />}
      <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap text-foreground">{text}</pre>
    </div>
  );
}

function RunView({ run }: { run: RunResult }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">Chạy thử (chỉ test công khai)</p>
      {run.compileError ? (
        <CompileError text={run.compileError} badge />
      ) : (
        <ul className="flex flex-col gap-2">
          {run.tests.map((t, i) => (
            <TestCard key={t.testCaseId} label={`Test ${i + 1}`} status={t.status} timeMs={t.timeMs} io={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SubmissionView({ submission: s, onLoadCode }: { submission: SubmissionDetail; onLoadCode?: () => void }) {
  let pub = 0;
  let hidden = 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" role="status">
          <VerdictBadge verdict={verdictOf(s.status)} />
          <span className="text-sm font-semibold text-foreground">{s.score} điểm</span>
          <span className="text-sm text-muted-foreground">
            {s.passedTests}/{s.totalTests} test đạt
          </span>
        </div>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1"><dt>Ngôn ngữ:</dt><dd className="text-foreground">{LANGUAGES[s.language]}</dd></div>
          <div className="flex gap-1"><dt>Thời gian lớn nhất:</dt><dd className="font-mono text-foreground">{formatMs(s.maxTimeMs)}</dd></div>
          <div className="flex gap-1"><dt>Bộ nhớ lớn nhất:</dt><dd className="font-mono text-foreground">{formatKb(s.maxMemoryKb)}</dd></div>
        </dl>
        {onLoadCode && (
          <Button variant="outline" size="sm" className="w-fit max-md:h-11" onClick={onLoadCode}>
            <FileInput data-icon="inline-start" aria-hidden />
            Nạp code này vào editor
          </Button>
        )}
      </div>
      {s.status === 'internal_error' && (
        <p className="text-sm text-muted-foreground">Hệ thống chấm gặp lỗi với lần nộp này, hãy nộp lại.</p>
      )}
      {s.compileError && <CompileError text={s.compileError} />}
      <ul className="flex flex-col gap-2">
        {[...s.results]
          .sort((a, b) => a.position - b.position)
          .map((r) =>
            r.isPublic ? (
              <TestCard key={r.testCaseId} label={`Test ${++pub}`} status={r.status} timeMs={r.timeMs} io={r} />
            ) : (
              <TestCard key={r.testCaseId} label={`Test ẩn #${++hidden}`} status={r.status} timeMs={r.timeMs} />
            ),
          )}
      </ul>
    </div>
  );
}

// Khung dưới editor: Test case (test công khai) / Kết quả (đang chấm, chạy thử, bài nộp).
export function ResultPanel({
  tab,
  onTabChange,
  exercise,
  grading,
  refreshing,
  onRefresh,
  result,
  onLoadCode,
  className,
}: {
  tab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  exercise: LearnExercise;
  grading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  result: ShownResult | null;
  onLoadCode?: (s: SubmissionDetail) => void;
  className?: string;
}) {
  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as ResultTab)} className={cn('min-h-0 gap-0 bg-card', className)}>
      <div className="border-b px-2">
        <TabsList variant="line" className={PANEL_TABS} aria-label="Test case và kết quả">
          <TabsTrigger value="tests" className="flex-none px-3">Test case</TabsTrigger>
          <TabsTrigger value="result" className="flex-none px-3">Kết quả</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tests" className="min-h-0 overflow-y-auto p-3">
        <ul className="flex flex-col gap-2">
          {exercise.publicTests.map((t, i) => (
            <li key={t.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <span className="text-sm font-semibold text-foreground">Test {i + 1}</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <IoBlock label="Input" value={t.input} />
                <IoBlock label="Output mong đợi" value={t.expectedOutput} />
              </div>
            </li>
          ))}
        </ul>
        {exercise.hiddenTestCount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            + {exercise.hiddenTestCount} test ẩn, chỉ chấm khi nộp bài.
          </p>
        )}
      </TabsContent>

      <TabsContent value="result" className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3">
        {grading && (
          <Alert role="status">
            <LoaderCircle className="motion-safe:animate-spin" aria-hidden />
            <AlertTitle>Đang chấm…</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              Bấm Làm mới để xem kết quả, hoặc xem ở tab Lịch sử nộp
              <Button variant="outline" size="sm" className="max-md:h-11" isLoading={refreshing} onClick={onRefresh}>
                <RefreshCw data-icon="inline-start" aria-hidden />
                Làm mới
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {grading && result && <Separator />}
        {result?.type === 'run' && <RunView run={result.run} />}
        {result?.type === 'submission' && (
          <SubmissionView
            submission={result.submission}
            onLoadCode={
              onLoadCode && exercise.languages.includes(result.submission.language)
                ? () => onLoadCode(result.submission)
                : undefined
            }
          />
        )}
        {!grading && !result && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Bấm <strong className="font-semibold text-foreground">Chạy thử</strong> để kiểm tra với test công khai, hoặc{' '}
            <strong className="font-semibold text-foreground">Nộp bài</strong> để chấm toàn bộ test.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
