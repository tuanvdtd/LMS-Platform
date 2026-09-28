import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { StatCard } from '@/components/shared/product-ui';
import { funnelData, courses } from '@/lib/mocks/data';
import { RevenueChart } from './_components/revenue-chart';

export const metadata: Metadata = { title: 'Doanh thu & Bán hàng | SkillPath' };

// Mock figures, generated once per server process (source used Math.random in render).
const COMPARISON = courses.slice(0, 4).map((c) => ({
  ...c,
  revenue: (Math.random() * 50 + 20).toFixed(0),
  refund: (Math.random() * 3).toFixed(1),
}));

export default function AnalyticsRevenuePage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          Doanh thu & Bán hàng
        </h1>
        <div className="flex items-center gap-2">
          <select
            className="text-sm border rounded-lg px-3 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            {courses.map((c) => <option key={c.id}>{c.title.slice(0, 30)}…</option>)}
          </select>
          <select
            className="text-sm border rounded-lg px-3 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            <option>Tháng 9/2025</option>
            <option>Tháng 8/2025</option>
          </select>
          <button
            className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Tổng doanh thu" value="107.000.000₫" change={9.2} />
        <StatCard label="Doanh thu thực nhận" value="74.900.000₫" sub="Sau phí 30%" />
        <StatCard label="Số đơn" value="284" change={12.5} />
        <StatCard label="Giá trị đơn TB" value="376.760₫" change={-2.1} />
        <StatCard label="Tỉ lệ hoàn tiền" value="1.4%" change={0.2} />
      </div>

      {/* Revenue chart */}
      <RevenueChart />

      {/* Funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Phễu chuyển đổi</h2>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={step.step}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--foreground)' }}>{step.step}</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--foreground)' }}>
                    {step.value.toLocaleString()} <span style={{ color: 'var(--muted-foreground)' }}>({step.pct}%)</span>
                  </span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden" style={{ background: 'var(--secondary)' }}>
                  <div
                    className="h-full rounded-lg flex items-center pl-3 text-white text-xs font-semibold transition-all"
                    style={{
                      width: `${step.pct}%`,
                      background: `hsl(${220 - i * 30}, 70%, ${50 + i * 5}%)`,
                      minWidth: '5%',
                    }}
                  >
                    {step.pct}%
                  </div>
                </div>
                {i < funnelData.length - 1 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--skill-weak)' }}>
                    ↓ Rớt {((1 - funnelData[i + 1].pct / step.pct) * 100).toFixed(0)}% ở bước này
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Course comparison */}
        <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>So sánh khoá học</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Khoá học', 'DT (₫)', 'Học viên', 'Rating', 'Hoàn tiền'].map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {COMPARISON.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="py-2 px-2 truncate max-w-24" style={{ color: 'var(--foreground)' }}>{c.title.slice(0, 18)}…</td>
                    <td className="py-2 px-2 font-mono" style={{ color: 'var(--foreground)' }}>{c.revenue}M</td>
                    <td className="py-2 px-2" style={{ color: 'var(--foreground)' }}>{c.studentCount.toLocaleString()}</td>
                    <td className="py-2 px-2 text-amber-500 font-bold">{c.rating}</td>
                    <td className="py-2 px-2" style={{ color: 'var(--foreground)' }}>{c.refund}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
