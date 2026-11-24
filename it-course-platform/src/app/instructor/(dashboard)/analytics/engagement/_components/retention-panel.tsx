// src/app/instructor/(dashboard)/analytics/engagement/_components/retention-panel.tsx
'use client';

import { AlertTriangle, Eye, Info, Repeat2, TrendingDown } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { RetentionSkeleton } from '@/components/skeletons/engagement-skeleton';
import { LONG_VIDEO_ADVICE, PEAK_ADVICE, dropText, fmtClock, fmtShare, peakText } from '@/lib/analytics';
import { getRetention } from '@/lib/api/analytics';
import type { Retention } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';
import { useKeyed } from '../../_components/use-keyed';

const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const MARGIN = { top: 24, right: 8, bottom: 0, left: 0 };
const Y_W = 40; // cùng bề rộng trục Y để hai biểu đồ thẳng hàng theo trục X
type Row = { t: number; retention: number; stay: number; rewatch: number };

// itemId = bài đang chọn; trùng defaultLecture thì dùng dữ liệu kèm theo, không gọi API.
export function RetentionPanel({ itemId, enrolled, defaultLecture }: { itemId: string; enrolled: number; defaultLecture: Retention | null }) {
  const own = defaultLecture?.itemId === itemId;
  const { data, error, reload } = useKeyed(own ? null : itemId, getRetention);
  const r = own ? defaultLecture : data;
  return (
    <div id="retention" className="scroll-mt-6">
      {error ? (
        <AnalyticsEmpty icon={AlertTriangle} title="Không tải được đường giữ chân">
          <Button variant="outline" size="sm" onClick={reload}>
            Thử lại
          </Button>
        </AnalyticsEmpty>
      ) : !r ? (
        <RetentionSkeleton />
      ) : (
        <Body r={r} enrolled={enrolled} />
      )}
    </div>
  );
}

function Body({ r, enrolled }: { r: Retention; enrolled: number }) {
  const title = `Đường giữ chân: Bài ${r.label} — ${r.title}`;
  const description = `${r.n} người xem / ${enrolled} ghi danh`;
  if (r.n === 0) {
    return (
      <Panel title={title} description={description}>
        <AnalyticsEmpty icon={Eye} title="Chưa có ai xem video này" />
      </Panel>
    );
  }
  const enough = r.n >= r.minViewers;
  // Trục số 0..durationSec; thêm điểm cuối để bậc thang của ô cuối kéo tới hết video.
  const last = r.points[r.points.length - 1];
  const rows: Row[] = last ? [...r.points, { ...last, t: r.durationSec }] : [];
  const xAxis = (hide: boolean) => (
    <XAxis type="number" dataKey="t" domain={[0, r.durationSec]} tickFormatter={fmtClock} tick={TICK} tickCount={7} hide={hide} />
  );
  const yAxis = (
    <YAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={TICK} width={Y_W} />
  );
  const long = enough && r.durationSec > 720 && r.finished !== null && r.finished < 0.5;
  return (
    <Panel title={title} description={description}>
      <div className="flex flex-col">
        <div
          className="h-[220px]"
          role="img"
          aria-label={`Tỉ lệ người xem còn đang xem theo thời điểm trong video, ${r.peaks.length} đoạn tua lại nhiều${r.drop ? ', 1 điểm rời bỏ' : ''}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              {xAxis(false)}
              {yAxis}
              <Tooltip
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as Row | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-sm">
                      <p className="mb-1 font-medium text-foreground">Thời điểm {fmtClock(p.t)}</p>
                      <p className="text-muted-foreground">
                        Đang xem: <span className="font-mono text-foreground">{fmtShare(p.retention)}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Xem lại: <span className="font-mono text-foreground">{fmtShare(p.rewatch)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              {r.peaks.map((p) => (
                <ReferenceArea
                  key={p.fromSec}
                  x1={p.fromSec}
                  x2={p.toSec}
                  fill="var(--warning)"
                  fillOpacity={0.2}
                  stroke="var(--warning)"
                  strokeOpacity={0.6}
                  label={{ value: 'Tua lại nhiều', position: 'top', fontSize: 11, fill: 'var(--foreground)' }}
                />
              ))}
              {r.drop && (
                <ReferenceArea
                  x1={r.drop.fromSec}
                  x2={r.drop.toSec}
                  fill="var(--danger)"
                  fillOpacity={0.2}
                  stroke="var(--danger)"
                  strokeOpacity={0.6}
                  label={{ value: 'Rời bỏ', position: 'top', fontSize: 11, fill: 'var(--foreground)' }}
                />
              )}
              <Area type="stepAfter" dataKey="retention" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.12} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="pl-10 text-xs text-muted-foreground">Tỉ lệ người xem tua lại</p>
        <div className="h-20" role="img" aria-label="Tỉ lệ người xem tua lại theo thời điểm">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ ...MARGIN, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              {xAxis(true)}
              <YAxis type="number" domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={TICK} width={Y_W} />
              <Tooltip content={() => null} />
              <Area type="stepAfter" dataKey="rewatch" stroke="var(--warning)" strokeWidth={1.5} fill="var(--warning)" fillOpacity={0.35} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {!enough && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden />
          Chưa đủ dữ liệu để kết luận (cần ≥ {r.minViewers} người xem).
        </p>
      )}
      {(r.peaks.length > 0 || r.drop || long) && (
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          {r.peaks.map((p) => (
            <li key={p.fromSec} className="flex items-start gap-2">
              <Repeat2 className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                {peakText(p)} {PEAK_ADVICE}
              </span>
            </li>
          ))}
          {r.drop && (
            <li className="flex items-start gap-2">
              <TrendingDown className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span>{dropText(r.drop)}</span>
            </li>
          )}
          {long && (
            <li className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{LONG_VIDEO_ADVICE}</span>
            </li>
          )}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Tua lại = người xem phát lại đoạn đó ít nhất hai lần. Rời bỏ = vị trí xa nhất người xem đạt tới; tua tới không bị tính là rời bỏ.
      </p>
    </Panel>
  );
}
