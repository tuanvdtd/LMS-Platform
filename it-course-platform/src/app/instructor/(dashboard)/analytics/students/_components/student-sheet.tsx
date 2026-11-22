'use client';

import { BellRing, BookCheck, ClipboardCheck, Code2, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtDate, fmtPct, lastActiveText, NUDGE_TEMPLATES, reasonText, VERDICT_META, withinDays } from '@/lib/analytics';
import { getStudentDetail } from '@/lib/api/analytics';
import type { StudentRow, TimelineEvent } from '@/types/analytics';
import { RiskBadge } from '../../_components/status-badge';
import { useKeyed } from '../../_components/use-keyed';

const EVENT_ICON = { enrolled: UserPlus, lecture_completed: BookCheck, quiz: ClipboardCheck, submission: Code2, nudge: Send } as const;

function eventText(e: TimelineEvent): string {
  switch (e.kind) {
    case 'enrolled':
      return 'Ghi danh khoá học';
    case 'lecture_completed':
      return `Hoàn thành bài giảng "${e.title}"`;
    case 'quiz':
      return `Nộp "${e.title}" lần ${e.attemptNo}: ${fmtPct(e.scorePct)} · ${e.passed ? 'Đạt' : 'Chưa đạt'}`;
    case 'submission':
      return `Nộp bài code "${e.title}": ${VERDICT_META[e.status].label} · ${e.score} điểm`;
    case 'nudge':
      return `Được nhắc (${NUDGE_TEMPLATES[e.nudgeKind].label.toLowerCase()})`;
  }
}

// Chỉ dữ liệu trong khoá: tiến độ, quiz, bài code, lần nhắc. Không có email, không có điểm kỹ năng Elo cá nhân.
export function StudentSheet({
  courseId,
  student,
  onClose,
  onNudge,
}: {
  courseId: string;
  student: StudentRow | null;
  onClose: () => void;
  onNudge: (s: StudentRow) => void;
}) {
  const { data } = useKeyed(student ? `${courseId}/${student.userId}` : null, getStudentDetail);
  const nudgedRecently = !!student?.lastNudge && withinDays(student.lastNudge.at, 7);
  return (
    <Sheet open={!!student} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {student && (
          <>
            <SheetHeader>
              <SheetTitle>{student.name}</SheetTitle>
              <SheetDescription>
                Ghi danh {fmtDate(student.enrolledAt)} · {lastActiveText(student.lastActiveAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-4">
              <div className="flex flex-col gap-2">
                <RiskBadge level={student.risk.level} />
                {student.risk.reasons.length > 0 && (
                  <ul className="list-disc flex flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {student.risk.reasons.map((r) => (
                      <li key={r.code}>{reasonText(r)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Tiến độ</dt>
                  <dd className="font-mono">{fmtPct(student.progressPct)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Quiz lượt đầu TB</dt>
                  <dd className="font-mono">{fmtPct(student.quiz.avgFirstPct)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bài code đạt</dt>
                  <dd className="font-mono">{student.code.total ? `${student.code.passed}/${student.code.total}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Đang dừng ở</dt>
                  <dd>{student.lastItem?.title ?? 'Chưa mở bài nào'}</dd>
                </div>
              </dl>
              <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-foreground">Hoạt động trong khoá</h3>
                {!data ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <ol className="flex flex-col gap-2.5">
                    {data.timeline.map((e, i) => {
                      const Icon = EVENT_ICON[e.kind];
                      return (
                        <li key={i} className="flex gap-2.5 text-sm">
                          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block">{eventText(e)}</span>
                            <span className="text-xs text-muted-foreground">{fmtDate(e.at)}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>
            <SheetFooter className="border-t">
              <Button disabled={student.risk.level === 'done' || nudgedRecently} onClick={() => onNudge(student)}>
                <BellRing data-icon="inline-start" />
                Nhắc học viên này
              </Button>
              {nudgedRecently && <p className="text-xs text-muted-foreground">Đã nhắc trong 7 ngày qua.</p>}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
