// src/app/instructor/(dashboard)/_components/overview-at-risk.tsx
import Link from 'next/link';
import { MessageButton } from '@/components/messages/message-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { fmtPct, givenName, reasonText } from '@/lib/analytics';
import type { InstructorOverview } from '@/types/analytics';
import { Panel } from '../analytics/_components/analytics-shell';

export function OverviewAtRisk({ rows, topCourseId }: { rows: InstructorOverview['atRisk']; topCourseId: string | null }) {
  return (
    <Panel
      title="Học viên nguy cơ cao"
      action={
        topCourseId && (
          <Link href={`/instructor/analytics/students?course=${topCourseId}&level=high`} className={buttonVariants({ variant: 'link', size: 'sm' })}>
            Xem tất cả
          </Link>
        )
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có học viên nguy cơ cao</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li key={`${s.userId}:${s.courseId}`} className="flex items-start gap-3 rounded-lg border p-3">
              <Avatar className="size-9">
                {s.image && <AvatarImage src={s.image} alt="" />}
                <AvatarFallback>{givenName(s.name).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">{s.courseTitle} · Tiến độ {fmtPct(s.progressPct)}</p>
                <p className="text-xs text-foreground">{s.reasons.map(reasonText).join('; ')}</p>
              </div>
              <MessageButton userId={s.userId} basePath="/instructor/messages" canMessage={s.canMessage} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
