'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

type RevenuePoint = { date: string; revenue: number };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {

  return (
    <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Doanh thu theo ngày</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} interval={4} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
          <Tooltip
            formatter={(v) => [`${Number(v).toLocaleString('vi-VN')}₫`, 'Doanh thu']}
            contentStyle={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#rev2)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
