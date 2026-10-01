'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const DIST_DATA = [
  { range: '0-10', count: 2 },
  { range: '10-20', count: 5 },
  { range: '20-30', count: 8 },
  { range: '30-40', count: 12 },
  { range: '40-50', count: 18 },
  { range: '50-60', count: 32 },
  { range: '60-70', count: 41 },
  { range: '70-80', count: 55 },
  { range: '80-90', count: 38 },
  { range: '90-100', count: 22 },
];

export function ScoreDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={DIST_DATA}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="range" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {DIST_DATA.map((d, i) => (
            <Cell key={i} fill={d.range.startsWith('7') || d.range.startsWith('8') || d.range.startsWith('9') ? '#22c55e' : '#2563eb'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CodeVerdictPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="50%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
