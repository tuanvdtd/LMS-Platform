// src/app/instructor/(dashboard)/analytics/revenue/_components/funnel-panel.tsx
'use client';

import { AlertTriangle, Info, RotateCw } from 'lucide-react';
import { cn } from 'cn';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getFunnel } from '@/lib/api/analytics';
import { fmtDate, fmtNum, fmtShare, FUNNEL_STEP_META } from '@/lib/analytics';
import type { Funnel, Sales } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';
import { useKeyed } from '../../_components/use-keyed';

const DAYS = [7, 30, 90] as const;
type Days = (typeof DAYS)[number];
const DAY_MS = 86_400_000;

const loadFunnel = (key: string) => {
  const [courseId, days] = key.split('|');
  return getFunnel(courseId, Number(days) as Days);
};

// Mặc định: khoá có phí nhiều lượt bán nhất; không có thì khoá đầu.
const defaultCourse = (courses: Sales['courses']) =>
  courses.filter((c) => c.priceAmount > 0).sort((a, b) => b.sales - a.sales)[0] ?? courses[0];

export function FunnelPanel({ courses }: { courses: Sales['courses'] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [days, setDays] = useState<Days>(30);
  const courseId = courses.find((c) => c.courseId === picked)?.courseId ?? defaultCourse(courses)?.courseId ?? null;
  const { data, error, reload } = useKeyed(courseId && `${courseId}|${days}`, loadFunnel, { keepPrevious: true });
  const items = Object.fromEntries(courses.map((c) => [c.courseId, c.title]));

  return (
    <Panel
      title="Phễu chuyển đổi"
      description="Người xem trang khoá đi tiếp tới từng bước cho đến khi ghi danh."
      action={
        courseId && (
          <div className="flex flex-wrap items-center gap-2">
            <Select items={items} value={courseId} onValueChange={(v) => v && setPicked(v)}>
              <SelectTrigger className="h-11 w-full bg-card sm:h-9 sm:w-64" aria-label="Chọn khoá cho phễu" title={items[courseId]}>
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {courses.map((c) => (
                    <SelectItem key={c.courseId} value={c.courseId}>{c.title}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ToggleGroup variant="outline" aria-label="Chọn số ngày" value={[String(days)]} onValueChange={(v) => v[0] && setDays(Number(v[0]) as Days)}>
              {DAYS.map((d) => (
                <ToggleGroupItem key={d} value={String(d)} className="min-h-11 px-3 sm:min-h-9 aria-pressed:bg-(--primary-light) aria-pressed:text-primary">
                  {d} ngày
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )
      }
    >
      {!courseId ? (
        <AnalyticsEmpty icon={Info} title="Chưa có khoá học">Phễu xuất hiện khi bạn có khoá học.</AnalyticsEmpty>
      ) : error ? (
        <AnalyticsEmpty
          icon={AlertTriangle}
          title="Không tải được phễu"
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              <RotateCw data-icon="inline-start" /> Thử lại
            </Button>
          }
        />
      ) : !data || data.courseId !== courseId ? (
        <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label="Đang tải">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <FunnelBody funnel={data} busy={data.days !== days} />
      )}
    </Panel>
  );
}

function FunnelBody({ funnel, busy }: { funnel: Funnel; busy: boolean }) {
  const { steps, weakest, minVisitors, isFree } = funnel;
  const [now] = useState(() => Date.now());
  const first = steps[0]?.people ?? 0;
  const weakIdx = weakest ? steps.findIndex((s) => s.key === weakest.key) : -1;
  const advice = weakest ? FUNNEL_STEP_META[isFree ? 'cart' : weakest.key].advice : '';
  const showSince = funnel.trackedSince && new Date(funnel.trackedSince).getTime() > now - funnel.days * DAY_MS;

  return (
    <div className={cn('flex flex-col gap-4 transition-opacity', busy && 'opacity-50')} aria-busy={busy}>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s.key} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
              <span className="font-medium text-foreground">{FUNNEL_STEP_META[s.key].label}</span>
              <span className="text-muted-foreground tabular-nums">
                <strong className="font-mono text-foreground">{fmtNum(s.people)}</strong> người
                {i > 0 && ` · ${fmtShare(steps[i - 1].people ? s.people / steps[i - 1].people : null)} so với bước trước`}
                {` · ${fmtShare(first ? s.people / first : null)} so với bước 1`}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${first ? Math.max((s.people / first) * 100, s.people ? 1 : 0) : 0}%` }} />
            </div>
          </li>
        ))}
      </ol>
      {first < minVisitors ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Chưa đủ dữ liệu để kết luận (cần ≥ {minVisitors} người xem trang).
        </p>
      ) : (
        weakest &&
        weakIdx > 0 && (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertTitle>
              Bước rơi nhiều nhất: {FUNNEL_STEP_META[steps[weakIdx - 1].key].label} → {FUNNEL_STEP_META[weakest.key].label}: chỉ {fmtShare(weakest.rate)} đi tiếp.
            </AlertTitle>
            <AlertDescription>{advice}</AlertDescription>
          </Alert>
        )
      )}
      <p className="text-xs text-muted-foreground">
        Số người xem là ước lượng: khách chưa đồng ý cookie được đếm theo lượt tải trang.
        {showSince && ` Dữ liệu lượt xem ghi từ ${fmtDate(funnel.trackedSince!)}.`}
      </p>
    </div>
  );
}
