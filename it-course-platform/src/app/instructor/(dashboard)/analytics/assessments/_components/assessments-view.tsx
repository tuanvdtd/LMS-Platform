'use client';

import { AlertTriangle, ChevronRight, ClipboardCheck, OctagonAlert } from 'lucide-react';
import Link from 'next/link';
import { AnalyticsAssessmentsBody, AnalyticsAssessmentsSkeleton } from '@/components/skeletons/analytics-assessments-skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtNum, fmtPct } from '@/lib/analytics';
import { getAssessments } from '@/lib/api/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';
import { CourseScopedPage } from '../../_components/course-select';
import { useKeyed } from '../../_components/use-keyed';
import { VerdictBar } from '../../_components/verdict-bar';

export function AssessmentsView() {
  return (
    <CourseScopedPage
      title="Chất lượng bài kiểm tra"
      description="Câu hỏi nào đo tốt, câu nào cần sửa, bài code nào học viên đang mắc kẹt. Tính trên lượt làm đầu tiên của mỗi học viên."
      skeleton={<AnalyticsAssessmentsSkeleton />}
    >
      {(course) => <Overview key={course.id} courseId={course.id} />}
    </CourseScopedPage>
  );
}

function FlagSummary({ n, min, fix, review }: { n: number; min: number; fix: number; review: number }) {
  if (n < min) return <Badge variant="secondary">Chưa đủ dữ liệu ({n}/{min})</Badge>;
  if (!fix && !review) return <Badge variant="success">Tốt</Badge>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {fix > 0 && (
        <Badge variant="danger">
          <OctagonAlert aria-hidden />
          {fix} cần sửa
        </Badge>
      )}
      {review > 0 && (
        <Badge variant="warning">
          <AlertTriangle aria-hidden />
          {review} nên xem
        </Badge>
      )}
    </span>
  );
}

const detail = 'inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline';

function Overview({ courseId }: { courseId: string }) {
  const { data, error } = useKeyed(courseId, getAssessments);
  if (error) return <AnalyticsEmpty icon={AlertTriangle} title="Không tải được số liệu">Tải lại trang để thử lại.</AnalyticsEmpty>;
  if (!data) return <AnalyticsAssessmentsBody />;
  if (!data.quizzes.length && !data.exercises.length) {
    return (
      <AnalyticsEmpty icon={ClipboardCheck} title="Khoá chưa có quiz hay bài code">
        Thêm quiz hoặc bài code trong chương trình học để xem phân tích.
      </AnalyticsEmpty>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {data.quizzes.length > 0 && (
        <Panel title="Quiz" description={`Chỉ gắn cờ câu hỏi khi có từ ${data.minSample} lượt làm đầu tiên.`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead className="text-right">Đã làm</TableHead>
                <TableHead className="text-right">Điểm TB lượt đầu</TableHead>
                <TableHead className="text-right">Đạt ngay lượt đầu</TableHead>
                <TableHead className="text-right">Đạt sau cùng</TableHead>
                <TableHead>Câu hỏi</TableHead>
                <TableHead>
                  <span className="sr-only">Chi tiết</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.quizzes.map((q) => (
                <TableRow key={q.quizId}>
                  <TableCell>
                    <p className="font-medium text-foreground">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.sectionTitle} · {q.questionCount} câu
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtNum(q.learners)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtPct(q.firstAttempt.meanPct)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtPct(q.firstAttempt.passRatePct)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtPct(q.finalPassRatePct)}</TableCell>
                  <TableCell>
                    <FlagSummary n={q.learners} min={data.minSample} fix={q.flagged.fix} review={q.flagged.review} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/instructor/analytics/assessments/quizzes/${q.quizId}`} className={detail}>
                      Chi tiết
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
      {data.exercises.length > 0 && (
        <Panel title="Bài code" description="Mắc kẹt = đã nộp từ 3 lần mà chưa Accepted.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài code</TableHead>
                <TableHead className="text-right">Đã nộp</TableHead>
                <TableHead className="text-right">Đã đạt</TableHead>
                <TableHead className="text-right">Lần nộp TB đến khi đạt</TableHead>
                <TableHead className="text-right">Đang mắc kẹt</TableHead>
                <TableHead className="min-w-48">Kết quả các bài nộp</TableHead>
                <TableHead>
                  <span className="sr-only">Chi tiết</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.exercises.map((e) => (
                <TableRow key={e.exerciseId}>
                  <TableCell className="font-medium text-foreground">{e.title}</TableCell>
                  <TableCell className="text-right font-mono">{fmtNum(e.learners)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtPct(e.passRatePct)}</TableCell>
                  <TableCell className="text-right font-mono">{e.avgSubmissionsToPass === null ? '—' : fmtNum(e.avgSubmissionsToPass)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtNum(e.stuck)}</TableCell>
                  <TableCell>
                    <VerdictBar verdicts={e.verdicts} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/instructor/analytics/assessments/exercises/${e.exerciseId}`} className={detail}>
                      Chi tiết
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
