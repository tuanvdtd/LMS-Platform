import Link from 'next/link';
import { ChevronLeft, CircleCheck, CircleX, Play, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { QuizOverview } from '@/types/learn-quiz';
import { PassBadge } from './quiz-result';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function QuizStart({
  courseSlug,
  overview,
  starting,
  onStart,
}: {
  courseSlug: string;
  overview: QuizOverview;
  starting: boolean;
  onStart: () => void;
}) {
  const { attempts } = overview;
  const resume = !!overview.inProgressAttemptId;
  const cta = resume ? 'Làm tiếp' : attempts.length ? 'Làm lại' : 'Bắt đầu';
  const CtaIcon = resume || !attempts.length ? Play : RotateCcw;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link href={`/course/${courseSlug}`} className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Về khoá học
      </Link>

      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3">
          {attempts.length > 0 && <PassBadge passed={overview.passed} labels={['Đã đạt', 'Chưa đạt']} />}
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{overview.title}</h1>
          {overview.description && <Markdown className="text-base text-muted-foreground">{overview.description}</Markdown>}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Số câu hỏi" value={overview.questionCount} />
          <Stat label="Điểm đạt" value={`${overview.passScorePct}%`} />
          <Stat label="Điểm cao nhất" value={overview.bestScorePct === null ? '—' : `${overview.bestScorePct}%`} />
        </dl>

        {overview.topics.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">Kỹ năng đánh giá</h2>
            <ul className="flex flex-wrap gap-2">
              {overview.topics.map((t) => (
                <li key={t.id}><Badge variant="secondary">{t.name}</Badge></li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {resume ? 'Bạn đang có một lượt làm dở — tiếp tục từ chỗ đã dừng.' : 'Không giới hạn thời gian và số lần làm.'}
          </p>
          <Button size="lg" className="h-11 w-full sm:w-auto" disabled={starting} onClick={onStart}>
            <CtaIcon data-icon="inline-start" aria-hidden /> {starting ? 'Đang mở…' : cta}
          </Button>
        </div>
      </section>

      <section aria-labelledby="history-heading" className="mt-8 flex flex-col gap-3">
        <h2 id="history-heading" className="text-lg font-semibold text-foreground">Lịch sử làm bài</h2>
        {attempts.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có lượt nào. Bấm “Bắt đầu” để làm bài đầu tiên.
          </p>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lần</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead><span className="sr-only">Xem lại</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">#{a.attemptNo}</TableCell>
                    <TableCell className="font-mono font-semibold">{a.scorePct}%</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {a.passed
                          ? <CircleCheck className="size-4 text-(--skill-strong)" aria-hidden />
                          : <CircleX className="size-4 text-(--skill-weak)" aria-hidden />}
                        {a.passed ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(a.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/learn/${courseSlug}/quiz/${overview.itemId}?attempt=${a.id}`}
                        className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary hover:underline"
                        aria-label={`Xem lại lần ${a.attemptNo}`}
                      >
                        Xem lại
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-bold text-foreground">{value}</dd>
    </div>
  );
}

// Skeleton khớp layout màn Start (loading.tsx + lúc tải ở client).
export function QuizStartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-19 rounded-lg" />)}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full sm:ml-auto sm:w-32" />
      </div>
      <Skeleton className="mt-8 mb-3 h-6 w-40" />
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  );
}
