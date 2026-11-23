'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mark của Recharts dùng mã màu (DESIGN.md: ngoại lệ duy nhất) theo token primary / slate; lưới, chữ trục dùng biến CSS như revenue-chart.
const PASS = '#2563eb';
const BELOW = '#94a3b8';

export function ScoreHistogram({ bins, passPct }: { bins: { fromPct: number; toPct: number; count: number }[]; passPct: number }) {
  const data = bins.map((b) => ({ label: `${b.fromPct}–${b.toPct}`, count: b.count, pass: b.fromPct >= passPct }));
  return (
    <div className="h-56" role="img" aria-label={`Số học viên theo khoảng điểm lượt đầu: ${data.map((d) => `${d.label}%: ${d.count}`).join('; ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
            formatter={(v) => [`${v} học viên`, 'Số người']}
            labelFormatter={(l) => `Điểm ${l}%`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.pass ? PASS : BELOW} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
