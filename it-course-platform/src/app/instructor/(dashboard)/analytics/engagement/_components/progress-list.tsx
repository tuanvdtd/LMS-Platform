// src/app/instructor/(dashboard)/analytics/engagement/_components/progress-list.tsx
import { AlertTriangle, ChevronRight, ClipboardCheck, Code2, FileText, Info, ListChecks, PlayCircle, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { fmtShare } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { Engagement, ProgressItemType } from '@/types/analytics';
import { ITEM_TYPE_LABEL } from '@/types/curriculum';
import { Panel } from '../../_components/analytics-shell';

const ICON: Record<ProgressItemType, LucideIcon> = { lecture: FileText, quiz: ListChecks, practice_test: ClipboardCheck, coding_exercise: Code2 };

// videoIds: bài giảng có video (data.lectures); bài giảng còn lại là tài liệu (PDF) → không có đường giữ chân.
export function ProgressList({ courseId, progress, videoIds }: { courseId: string; progress: Engagement['progress']; videoIds: ReadonlySet<string> }) {
  const { n, minLearners, minAgeDays, items, bottleneck } = progress;
  const enough = n >= minLearners;
  const hot = enough ? bottleneck : null;
  const hotItem = hot ? items.find((i) => i.itemId === hot.itemId) : undefined;
  const hotIsDoc = hotItem?.type === 'lecture' && !videoIds.has(hotItem.itemId);
  const href = !hotItem
    ? ''
    : hotItem.type === 'lecture'
      ? `?course=${courseId}&lecture=${hotItem.itemId}#retention`
      : `/instructor/analytics/assessments?course=${courseId}`;
  return (
    <Panel title="Tiến độ theo bài" description={`Tỉ lệ học viên hoàn thành từng bài, tính trên ${n} học viên ghi danh từ ${minAgeDays} ngày trước`}>
      {!enough && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden />
          Chưa đủ dữ liệu để kết luận (cần ≥ {minLearners} học viên ghi danh từ {minAgeDays} ngày trước).
        </p>
      )}
      {n > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((it) => {
            const Icon = it.type === 'lecture' && videoIds.has(it.itemId) ? PlayCircle : ICON[it.type];
            const isHot = hot?.itemId === it.itemId;
            const pct = it.completed === null ? 0 : Math.round(it.completed * 100);
            return (
              <li
                key={it.itemId}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg border border-transparent px-3 py-2 sm:grid-cols-[minmax(0,20rem)_1fr_4rem]',
                  isHot && 'border-warning-border bg-warning-soft',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="shrink-0 text-xs text-muted-foreground">{ITEM_TYPE_LABEL[it.type]}</span>
                  <span className="truncate text-sm text-foreground">
                    <span className="font-mono">{it.label}</span> {it.title}
                  </span>
                </div>
                <span className="text-right font-mono text-sm text-foreground sm:order-3">{fmtShare(it.completed)}</span>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <div className="h-2 flex-1 rounded-full bg-muted" role="img" aria-label={fmtShare(it.completed)}>
                    <div className={cn('h-full rounded-full', isHot ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
                  </div>
                  {isHot && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning">
                      <AlertTriangle className="size-3.5" aria-hidden /> Nút thắt
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hot && hotItem && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
          <span>
            Bài {hotItem.label} chỉ {fmtShare(hot.completed)} học viên hoàn thành, giảm {Math.round(hot.drop * 100)} điểm so với bài trước.
          </span>
          {!hotIsDoc && (
            <Link href={href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              {hotItem.type === 'lecture' ? 'Xem đường giữ chân' : 'Xem phân tích bài kiểm tra'}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </p>
      )}
    </Panel>
  );
}
