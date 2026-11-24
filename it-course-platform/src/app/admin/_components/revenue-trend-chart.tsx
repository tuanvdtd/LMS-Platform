'use client';

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatVnd } from '@/types/revenue';
import type { AdminOverview } from '@/types/admin';

// Cột = primary (doanh thu), đường = foreground (phí sàn): khác độ sáng chứ không chỉ khác hue; legend bằng chữ.
const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const dm = (date: string) => `${date.slice(8)}/${date.slice(5, 7)}`;
const short = (n: number) => (n >= 999_500 ? `${+(n / 1e6).toFixed(1)}`.replace('.', ',') + 'tr' : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

export function RevenueTrendChart({ daily }: { daily: AdminOverview['daily'] }) {
  const total = daily.reduce((s, d) => s + d.gmv, 0);
  const peak = daily.reduce((m, d) => (d.gmv > m.gmv ? d : m), daily[0]);
  const label = `Doanh thu ${daily.length} ngày: tổng ${formatVnd(total)}, cao nhất ${formatVnd(peak.gmv)} ngày ${dm(peak.date)}`;
  return (
    <div>
      <ul className="mb-3 flex gap-4 text-xs text-muted-foreground" aria-hidden>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Doanh thu (cột)</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-foreground" />Phí sàn (đường)</li>
      </ul>
      <div className="h-72" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={dm} tick={TICK} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickFormatter={short} tick={TICK} width={44} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
              labelFormatter={(d) => `${dm(String(d))}/${String(d).slice(0, 4)}`}
              formatter={(v) => formatVnd(Number(v))}
            />
            <Bar dataKey="gmv" name="Doanh thu" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Line dataKey="platformFee" name="Phí sàn" stroke="var(--foreground)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
