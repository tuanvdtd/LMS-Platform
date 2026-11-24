// src/app/instructor/(dashboard)/analytics/engagement/_components/lectures-table.tsx
'use client';

import { Eye, Video } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtClock, fmtNum, fmtShare } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { Engagement } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';

export function LecturesTable({ lectures, selectedId }: { lectures: Engagement['lectures']; selectedId: string | null }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  if (!lectures.length) {
    return (
      <AnalyticsEmpty icon={Video} title="Khoá chưa có bài giảng video">
        Thêm bài giảng video để xem người xem dừng lại ở đâu.
      </AnalyticsEmpty>
    );
  }
  const pick = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('lecture', id);
    router.replace(`${pathname}?${next}#retention`);
  };
  return (
    <Panel title="Video" description="Bấm vào một bài để xem đường giữ chân của bài đó.">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bài</TableHead>
            <TableHead className="text-right">Thời lượng</TableHead>
            <TableHead className="text-right">Người xem</TableHead>
            <TableHead className="text-right">Xem ≥ 90%</TableHead>
            <TableHead className="text-right">Xem TB</TableHead>
            <TableHead className="text-right">Tua lại nhiều</TableHead>
            <TableHead className="text-right">Rời bỏ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lectures.map((l) => {
            const on = l.itemId === selectedId;
            return (
              <TableRow
                key={l.itemId}
                tabIndex={0}
                aria-selected={on}
                onClick={() => pick(l.itemId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pick(l.itemId);
                  }
                }}
                className={cn('cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring', on && 'bg-primary-soft shadow-[inset_3px_0_0_var(--primary)]')}
              >
                <TableCell className="font-medium text-foreground">
                  <span className="font-mono">{l.label}</span> {l.title}
                  {on && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Eye className="size-3.5" aria-hidden /> Đang xem
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">{fmtClock(l.durationSec)}</TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(l.viewers)} <span className="text-xs text-muted-foreground">· {fmtShare(l.started)} đã bắt đầu</span>
                </TableCell>
                <TableCell className="text-right font-mono">{fmtShare(l.finished)}</TableCell>
                <TableCell className="text-right font-mono">{fmtShare(l.avgWatched)}</TableCell>
                <TableCell className="text-right font-mono">{l.peaks || '—'}</TableCell>
                <TableCell className="text-right font-mono">{l.drop ? fmtClock(l.drop.fromSec) : '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}
