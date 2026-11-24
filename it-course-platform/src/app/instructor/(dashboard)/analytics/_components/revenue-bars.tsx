'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dayLabel, fmtNum, monthLabel } from '@/lib/analytics';
import { formatVnd } from '@/types/revenue';
import type { RevenuePoint, RevenueRange } from '@/types/analytics';

// Một series "Bạn nhận" nên không cần legend; màu primary như biểu đồ admin (dự án chưa có biến --chart-*).
const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const short = (n: number) => (n >= 999_500 ? `${+(n / 1e6).toFixed(1)}`.replace('.', ',') + ' tr' : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

export function RevenueBars({ points, range }: { points: RevenuePoint[]; range: RevenueRange }) {
  const label = range === '12m' ? monthLabel : dayLabel;
  return (
    <div>
      <div className="h-60" role="img" aria-label={`Doanh thu bạn nhận theo ${range === '12m' ? 'tháng' : 'ngày'}, ${points.length} kỳ gần nhất`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="key" tickFormatter={label} tick={TICK} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickFormatter={short} tick={TICK} width={48} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={({ active, payload }) => {
                const p = active ? (payload?.[0]?.payload as RevenuePoint | undefined) : undefined;
                if (!p) return null;
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-sm">
                    <p className="mb-1 font-medium text-foreground">{label(p.key)}</p>
                    <p className="text-muted-foreground">Bạn nhận: <span className="font-mono text-foreground">{formatVnd(p.earned)}</span></p>
                    <p className="text-muted-foreground">Học viên trả: <span className="font-mono text-foreground">{formatVnd(p.gross)}</span></p>
                    <p className="text-muted-foreground">Lượt bán: <span className="font-mono text-foreground">{fmtNum(p.sales)}</span></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="earned" name="Bạn nhận" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Doanh thu bạn nhận theo {range === '12m' ? 'tháng' : 'ngày'}</caption>
        <thead><tr><th>Kỳ</th><th>Bạn nhận</th><th>Lượt bán</th></tr></thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}><td>{label(p.key)}</td><td>{formatVnd(p.earned)}</td><td>{fmtNum(p.sales)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
