// src/app/instructor/(dashboard)/analytics/engagement/_components/activity-chart.tsx
'use client';

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNum, weekLabel } from '@/lib/analytics';
import type { Engagement } from '@/types/analytics';
import { Panel } from '../../_components/analytics-shell';

const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
type Week = Engagement['weekly'][number];

function Legend({ hasCurrent }: { hasCurrent: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-primary" aria-hidden /> Học viên hoạt động
      </li>
      {hasCurrent && (
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary opacity-45" aria-hidden /> Tuần này (đang diễn ra)
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 bg-foreground" aria-hidden /> Ghi danh mới
      </li>
    </ul>
  );
}

export function ActivityChart({ weekly }: { weekly: Week[] }) {
  return (
    <Panel title="Hoạt động 12 tuần" description="Số học viên có hoạt động học và số ghi danh mới theo tuần.">
      <Legend hasCurrent={weekly.some((w) => w.current)} />
      <div className="h-60" role="img" aria-label={`Học viên hoạt động và ghi danh mới theo tuần, ${weekly.length} tuần gần nhất`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="weekStart" tickFormatter={weekLabel} tick={TICK} interval="preserveStartEnd" minTickGap={20} />
            <YAxis tick={TICK} width={36} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={({ active, payload }) => {
                const w = active ? (payload?.[0]?.payload as Week | undefined) : undefined;
                if (!w) return null;
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-sm">
                    <p className="mb-1 font-medium text-foreground">
                      Tuần từ {weekLabel(w.weekStart)}
                      {w.current && ' (đang diễn ra)'}
                    </p>
                    <p className="text-muted-foreground">
                      Học viên hoạt động: <span className="font-mono text-foreground">{fmtNum(w.active)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Ghi danh mới: <span className="font-mono text-foreground">{fmtNum(w.newEnrollments)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="active" name="Học viên hoạt động" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {weekly.map((w) => (
                <Cell key={w.weekStart} fill="var(--primary)" fillOpacity={w.current ? 0.45 : 1} />
              ))}
            </Bar>
            <Line
              dataKey="newEnrollments"
              name="Ghi danh mới"
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--foreground)' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
