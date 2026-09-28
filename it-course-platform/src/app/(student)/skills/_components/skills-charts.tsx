'use client';

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const HISTORY_DATA = [
  { date: 'T7/24', overall: 45, hooks: 20, sql: 30 },
  { date: 'T8/24', overall: 52, hooks: 25, sql: 35 },
  { date: 'T9/24', overall: 58, hooks: 30, sql: 38 },
  { date: 'T10/24', overall: 62, hooks: 33, sql: 40 },
  { date: 'T11/24', overall: 65, hooks: 35, sql: 42 },
  { date: 'T12/24', overall: 68, hooks: 35, sql: 45 },
];

const RADAR_DATA = [
  { subject: 'Frontend', score: 65 },
  { subject: 'Backend', score: 45 },
  { subject: 'DevOps', score: 20 },
  { subject: 'Data', score: 30 },
  { subject: 'Mobile', score: 15 },
];

export function SkillsCharts() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Radar Chart */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Tổng quan theo track</h2>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={RADAR_DATA}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <Radar name="Năng lực" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress over time */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Lịch sử tiến bộ</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={HISTORY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
            />
            <Line type="monotone" dataKey="overall" stroke="#2563eb" strokeWidth={2} dot={false} name="Tổng thể" />
            <Line type="monotone" dataKey="hooks" stroke="#ef4444" strokeWidth={2} dot={false} name="React Hooks" />
            <Line type="monotone" dataKey="sql" stroke="#f97316" strokeWidth={2} dot={false} name="SQL Join" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
