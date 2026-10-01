'use client';

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, ReferenceLine, ReferenceArea,
} from 'recharts';
import { videoRetentionData } from '@/lib/mocks/data';

const LESSON_PROGRESS = [
  { lesson: 'Bài 1.1', students: 284, pct: 100 },
  { lesson: 'Bài 1.2', students: 271, pct: 95 },
  { lesson: 'Bài 1.3', students: 248, pct: 87 },
  { lesson: 'Quiz 1', students: 220, pct: 77 },
  { lesson: 'Bài 2.1', students: 198, pct: 70 },
  { lesson: 'Bài 2.2', students: 165, pct: 58 },
  { lesson: 'Bài 2.3', students: 140, pct: 49 },
  { lesson: 'Bài 2.4', students: 102, pct: 36 },
];

export function RetentionChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={videoRetentionData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
          formatter={(v, name) => [
            `${Number(v).toFixed(0)}%`,
            name === 'retention' ? 'Giữ chân' : 'Xem lại',
          ]}
        />
        <ReferenceArea x1="04:00" x2="05:00" fill="#f97316" fillOpacity={0.12} label={{ value: 'Xem lại nhiều', position: 'top', fontSize: 9, fill: '#f97316' }} />
        <ReferenceLine x="14:00" stroke="var(--skill-weak)" strokeDasharray="4 4" label={{ value: 'Điểm rớt', position: 'top', fontSize: 9, fill: 'var(--skill-weak)' }} />
        <Line type="monotone" dataKey="retention" stroke="#2563eb" strokeWidth={2} dot={false} name="retention" />
        <Line type="monotone" dataKey="rewatch" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="rewatch" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LessonProgressChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={LESSON_PROGRESS} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} domain={[0, 300]} />
        <YAxis type="category" dataKey="lesson" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={55} />
        <Tooltip
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
          formatter={(v, _, item) => [`${Number(v)} học viên (${(item as { payload?: { pct?: number } })?.payload?.pct ?? 0}%)`, 'Tiến đến']}
        />
        <Bar dataKey="students" radius={[0, 4, 4, 0]}>
          {LESSON_PROGRESS.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.pct < 50 ? '#ef4444' : entry.pct < 75 ? '#eab308' : '#2563eb'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
