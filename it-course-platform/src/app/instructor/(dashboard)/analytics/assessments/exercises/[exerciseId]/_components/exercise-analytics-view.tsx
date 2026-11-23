'use client';

import { AlertTriangle, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/shared/product-ui';
import { AnalyticsExerciseSkeleton } from '@/components/skeletons/analytics-exercise-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtNum, fmtPct } from '@/lib/analytics';
import { getExerciseAnalytics } from '@/lib/api/analytics';
import { DIFFICULTY_LABEL } from '@/lib/skills';
import type { ExerciseAnalytics } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../../../_components/analytics-shell';
import { useKeyed } from '../../../../_components/use-keyed';
import { VerdictBar } from '../../../../_components/verdict-bar';

type TestStat = ExerciseAnalytics['tests'][number];
const testName = (t: TestStat) => `Test ${t.isPublic ? 'công khai' : 'ẩn'} #${t.position + 1}`;

export function ExerciseAnalyticsView({ exerciseId }: { exerciseId: string }) {
  const { data, error } = useKeyed(exerciseId, getExerciseAnalytics);
  if (error) {
    return (
      <div className="flex-1 p-6">
        <AnalyticsEmpty icon={AlertTriangle} title="Không tìm thấy bài code">Bài code đã bị xoá hoặc không thuộc khoá của bạn.</AnalyticsEmpty>
      </div>
    );
  }
  if (!data) return <AnalyticsExerciseSkeleton />;
  const { exercise, summary, tests } = data;
  const worst = tests.reduce<TestStat | null>((w, t) => (t.failRatePct !== null && (!w || t.failRatePct > (w.failRatePct ?? -1)) ? t : w), null);
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link
            href={`/instructor/analytics/assessments?course=${exercise.courseId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Chất lượng bài kiểm tra
          </Link>
          <h1 className="text-2xl font-extrabold text-balance text-foreground">{exercise.title}</h1>
          <p className="text-sm text-muted-foreground">Bài code · độ khó {DIFFICULTY_LABEL[exercise.difficulty]}</p>
        </div>
        <Link
          href={`/instructor/courses/${exercise.courseId}/manage/exercises/${exercise.itemId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Pencil className="size-4" aria-hidden />
          Sửa bài code
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Học viên đã nộp" value={fmtNum(summary.learners)} />
        <StatCard label="Đã đạt" value={fmtPct(summary.passRatePct)} sub={`${fmtNum(summary.passed)} học viên`} />
        <StatCard label="Lần nộp TB đến khi đạt" value={summary.avgSubmissionsToPass === null ? '—' : fmtNum(summary.avgSubmissionsToPass)} />
        <StatCard label="Đang mắc kẹt" value={fmtNum(summary.stuck)} sub="Nộp từ 3 lần, chưa đạt" />
        <StatCard label="Bài nộp đã chấm" value={fmtNum(summary.submissions)} />
      </div>
      <Panel title="Kết quả các bài nộp">
        <VerdictBar verdicts={data.verdicts} legend />
      </Panel>
      {worst && worst.failRatePct !== null && worst.failRatePct >= 30 && (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>
            {testName(worst)} làm {fmtPct(worst.failRatePct)} bài nộp không qua
          </AlertTitle>
          <AlertDescription>
            {worst.isPublic
              ? 'Học viên thấy test này mà vẫn sai: xem đề đã mô tả đủ trường hợp này chưa.'
              : 'Học viên không thấy test ẩn: có thể đề chưa nói rõ trường hợp biên mà test này kiểm. Cân nhắc thêm gợi ý hoặc ví dụ.'}
          </AlertDescription>
        </Alert>
      )}
      <Panel title="Từng test" description="Tỉ lệ bài nộp đã chấm không qua test đó.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Đã chấm</TableHead>
              <TableHead className="text-right">Không qua</TableHead>
              <TableHead className="min-w-48">Tỉ lệ không qua</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">#{t.position + 1}</TableCell>
                <TableCell>
                  <Badge variant={t.isPublic ? 'info' : 'secondary'}>{t.isPublic ? 'Công khai' : 'Ẩn'}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{fmtNum(t.graded)}</TableCell>
                <TableCell className="text-right font-mono">{fmtNum(t.failed)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span className="block h-full bg-danger" style={{ width: `${t.failRatePct ?? 0}%` }} />
                    </span>
                    <span className="w-14 text-right font-mono text-xs">{fmtPct(t.failRatePct)}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
