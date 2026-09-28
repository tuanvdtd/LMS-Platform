import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, MessageCircle, Flag, TrendingDown, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/shared/product-ui';
import { atRiskStudents } from '@/lib/mocks/data';
import RevenueChart from '@/app/instructor/_components/revenue-chart';

export const metadata: Metadata = { title: 'Tổng quan giảng viên | SkillPath' };

export default function InstructorDashboardPage() {
  const alerts = [
    { icon: AlertTriangle, color: '#ef4444', label: '1 khoá bị từ chối', sub: 'Node.js Backend Pro cần chỉnh sửa', link: '/instructor/courses' },
    { icon: Flag, color: '#f97316', label: '2 báo cáo vi phạm mới', sub: 'Chờ xem xét', link: '/instructor/courses' },
    { icon: TrendingDown, color: '#eab308', label: '5 học viên nguy cơ bỏ học', sub: 'Cần liên hệ', link: '/instructor/analytics/students' },
    { icon: MessageCircle, color: '#3b82f6', label: '8 câu hỏi chưa trả lời', sub: 'Từ 3 khoá', link: '/instructor/qa' },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            Xin chào, Nguyễn Thành Long 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Cập nhật lần cuối: hôm nay, 09:42
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Tạo khoá học mới
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doanh thu tháng này" value="107.000.000₫" change={9.2} />
        <StatCard label="Học viên mới" value="284" change={12.5} />
        <StatCard label="Đánh giá trung bình" value="4.8 ★" change={0.1} />
        <StatCard label="Học viên hoạt động (7d)" value="1.842" change={-3.2} />
      </div>

      {/* Alerts */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <AlertTriangle size={16} className="text-amber-500" />
          Cần chú ý
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {alerts.map(({ icon: Icon, color, label, sub, link }) => (
            <Link
              key={label}
              href={link}
              className="flex items-start gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
              </div>
              <ChevronRight size={14} className="ml-auto mt-1 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Doanh thu 12 tháng</h2>
        <RevenueChart />
      </div>

      {/* At-risk students */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <TrendingDown size={16} className="text-red-500" />
            Học viên nguy cơ bỏ học
          </h2>
          <Link href="/instructor/analytics/students" className="text-xs text-blue-600 hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="space-y-2">
          {atRiskStudents.slice(0, 3).map((s) => (
            <div key={s.id} className="flex items-center gap-3 text-sm p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0" style={{ color: 'var(--foreground)' }}>
                {s.name.split(' ').pop()?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Tiến độ {s.progress}% · Hoạt động {s.lastActive}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: s.risk === 'high' ? '#fee2e2' : '#fef9c3',
                  color: s.risk === 'high' ? '#dc2626' : '#854d0e',
                }}
              >
                {s.risk === 'high' ? 'Nguy cơ cao' : 'Theo dõi'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
