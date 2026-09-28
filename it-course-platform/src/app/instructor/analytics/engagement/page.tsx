import type { Metadata } from 'next';
import { Download, Info } from 'lucide-react';
import { StatCard } from '@/components/shared/product-ui';
import { videoRetentionData } from '@/lib/mocks/data';
import { RetentionChart, LessonProgressChart } from './_components/engagement-charts';

export const metadata: Metadata = { title: 'Hành vi học | SkillPath' };

export default function AnalyticsEngagementPage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          Hành vi học
        </h1>
        <button
          className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <Download size={14} /> Xuất CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Học viên hoạt động (7d)" value="1.842" change={5.3} />
        <StatCard label="Tỉ lệ hoàn thành khoá" value="34.2%" change={2.1} />
        <StatCard label="Thời gian học TB/ngày" value="48 phút" change={8.0} />
      </div>

      {/* Video retention */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            Đường giữ chân video: Bài 2.2 — useEffect và Lifecycle
          </h2>
          <select
            className="text-xs border rounded px-2 py-1"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            <option>Bài 2.2 — useEffect</option>
            <option>Bài 1.1 — Giới thiệu</option>
          </select>
        </div>
        <div
          className="flex items-start gap-2 text-xs p-3 rounded-lg mb-4"
          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
        >
          <Info size={12} className="mt-0.5 shrink-0" />
          Đoạn <strong>04:30–05:10</strong> bị xem lại nhiều — cân nhắc giải thích thêm phần cleanup function.
          Học viên rớt nhiều ở <strong>14:00</strong>, xem xét thêm ví dụ thực tế.
        </div>
        <RetentionChart />

        {/* Heat strip */}
        <div className="mt-2">
          <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Mật độ xem lại</p>
          <div className="flex gap-0.5 h-3 rounded overflow-hidden">
            {videoRetentionData.map((d, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ background: `rgba(249, 115, 22, ${d.rewatch / 40})` }}
                title={`${d.time}: ${d.rewatch}% xem lại`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lesson dropout */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Tiến độ theo bài — Học viên dừng ở đâu?
        </h2>
        <LessonProgressChart />
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
          💡 Bài 2.4 là &quot;nút thắt&quot; với chỉ 36% học viên tiến đến — xem xét chia nhỏ bài hoặc thêm ví dụ.
        </p>
      </div>
    </div>
  );
}
