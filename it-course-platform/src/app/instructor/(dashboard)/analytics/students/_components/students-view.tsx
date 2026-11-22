'use client';

import { AlertTriangle, BellRing, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { ClientPagination } from '@/components/shared/client-pagination';
import { StatCard } from '@/components/shared/product-ui';
import { AnalyticsStudentsBody, AnalyticsStudentsSkeleton } from '@/components/skeletons/analytics-students-skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fmtDate, fmtNum, fmtPct, lastActiveText, reasonText, RISK_META } from '@/lib/analytics';
import { getStudents } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import type { StudentFilter, StudentRow } from '@/types/analytics';
import { AnalyticsEmpty } from '../../_components/analytics-shell';
import { CourseScopedPage } from '../../_components/course-select';
import { RiskBadge } from '../../_components/status-badge';
import { useKeyed } from '../../_components/use-keyed';
import { NudgeDialog } from './nudge-dialog';
import { StudentSheet } from './student-sheet';

const FILTERS: StudentFilter[] = ['all', 'high', 'watch', 'ok', 'new', 'done'];

// key = "<courseId>|<mức>|<trang>": loader cấp module (ổn định) để useKeyed tải đúng trang / bộ lọc.
function loadStudents(key: string) {
  const [courseId, level, page] = key.split('|');
  return getStudents(courseId, { level: level as StudentFilter, page: Number(page) });
}

export function StudentsView() {
  return (
    <CourseScopedPage
      title="Học viên"
      description="Ai đang tụt lại và vì sao. Mức nguy cơ dựa trên số ngày chưa vào học, tiến độ so với bạn cùng lứa ghi danh và điểm quiz lượt đầu."
      skeleton={<AnalyticsStudentsSkeleton />}
    >
      {(course) => <Students key={course.id} courseId={course.id} />}
    </CourseScopedPage>
  );
}

function Students({ courseId }: { courseId: string }) {
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useKeyed(`${courseId}|${filter}|${page}`, loadStudents, { keepPrevious: true });
  // Giữ cả dòng (không chỉ id) để nhắc được học viên đã chọn ở các trang khác.
  const [picked, setPicked] = useState<Map<string, StudentRow>>(() => new Map());
  const [nudging, setNudging] = useState<StudentRow[] | null>(null);
  const [viewing, setViewing] = useState<StudentRow | null>(null);
  if (error) return <AnalyticsEmpty icon={AlertTriangle} title="Không tải được danh sách học viên">Tải lại trang để thử lại.</AnalyticsEmpty>;
  if (!data) return <AnalyticsStudentsBody />;

  const { summary, counts, students: rows, total, pageSize } = data;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const nudgeable = (s: StudentRow) => s.risk.level !== 'done';
  const pageRows = rows.filter(nudgeable);
  const allOnPage = pageRows.length > 0 && pageRows.every((s) => picked.has(s.userId));
  const setMany = (list: StudentRow[], on: boolean) =>
    setPicked((prev) => {
      const next = new Map(prev);
      for (const s of list) {
        if (on) next.set(s.userId, s);
        else next.delete(s.userId);
      }
      return next;
    });
  const from = total ? (data.page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, data.page * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Đã ghi danh" value={fmtNum(summary.enrolled)} />
        <StatCard label="Hoạt động 7 ngày qua" value={fmtNum(summary.active7d)} />
        <StatCard label="Đã hoàn thành" value={fmtNum(summary.completed)} />
        <StatCard label="Nguy cơ cao" value={fmtNum(summary.high)} sub="Nên liên hệ sớm" />
        <StatCard label="Cần theo dõi" value={fmtNum(summary.watch)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          variant="outline"
          size="sm"
          className="flex-wrap"
          aria-label="Lọc theo mức nguy cơ"
          value={[filter]}
          onValueChange={(v) => {
            const f = v[0] as StudentFilter | undefined;
            if (!f) return;
            setFilter(f);
            setPage(1);
          }}
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f} value={f}>
              {f === 'all' ? 'Tất cả' : RISK_META[f].label} ({counts[f]})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-2">
          {picked.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">Đã chọn {picked.size}</span>
              <Button size="sm" variant="ghost" onClick={() => setPicked(new Map())}>
                Bỏ chọn
              </Button>
            </>
          )}
          <Button size="sm" disabled={!picked.size} onClick={() => setNudging([...picked.values()])}>
            <BellRing data-icon="inline-start" />
            Nhắc học viên
          </Button>
        </div>
      </div>
      {total === 0 ? (
        <AnalyticsEmpty icon={Users} title="Không có học viên ở mức này" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className={cn('overflow-x-auto rounded-xl border bg-card transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allOnPage} onCheckedChange={(v) => setMany(pageRows, v === true)} aria-label="Chọn tất cả học viên ở trang này" />
                  </TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead className="min-w-36">Tiến độ</TableHead>
                  <TableHead className="whitespace-nowrap">Hoạt động cuối</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Quiz lượt đầu</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Bài code</TableHead>
                  <TableHead className="min-w-64">Mức nguy cơ</TableHead>
                  <TableHead className="whitespace-nowrap">Nhắc gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.userId}>
                    <TableCell>
                      <Checkbox
                        checked={picked.has(s.userId)}
                        disabled={!nudgeable(s)}
                        onCheckedChange={(v) => setMany([s], v === true)}
                        aria-label={`Chọn ${s.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => setViewing(s)} className="text-left font-medium text-foreground hover:text-primary hover:underline">
                        {s.name}
                      </button>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">Ghi danh {fmtDate(s.enrolledAt)}</p>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Progress value={s.progressPct} className="flex-1" aria-label={`Tiến độ ${fmtPct(s.progressPct)}`} />
                        <span className="w-12 text-right font-mono text-xs">{fmtPct(s.progressPct)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{lastActiveText(s.lastActiveAt)}</TableCell>
                    <TableCell className="text-right font-mono">{fmtPct(s.quiz.avgFirstPct)}</TableCell>
                    <TableCell className="text-right font-mono">{s.code.total ? `${s.code.passed}/${s.code.total}` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <RiskBadge level={s.risk.level} />
                        {s.risk.reasons.length > 0 && (
                          <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            {s.risk.reasons.map((r) => (
                              <li key={r.code}>{reasonText(r)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.lastNudge ? (
                        <span className="flex flex-col gap-0.5">
                          <span>{fmtDate(s.lastNudge.at)}</span>
                          {s.lastNudge.returned ? (
                            <span className="flex items-center gap-1 text-xs text-success">
                              <Check className="size-3.5" aria-hidden />
                              Đã quay lại học
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Chưa quay lại</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Hiển thị <span className="font-mono text-foreground">{from}–{to}</span> / {fmtNum(total)} học viên
            </p>
            {pageCount > 1 && <ClientPagination page={data.page} pageCount={pageCount} onPageChange={setPage} />}
          </div>
        </div>
      )}
      <StudentSheet
        courseId={courseId}
        student={viewing}
        onClose={() => setViewing(null)}
        onNudge={(s) => {
          setViewing(null);
          setNudging([s]);
        }}
      />
      <NudgeDialog
        courseId={courseId}
        students={nudging}
        onClose={() => setNudging(null)}
        onSent={() => {
          setPicked(new Map());
          reload();
        }}
      />
    </div>
  );
}
