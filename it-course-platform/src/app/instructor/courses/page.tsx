import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Edit3, BarChart2, Eye, MoreVertical } from 'lucide-react';
import { courses } from '@/lib/mocks/data';
import { StatusBadge, RatingStars } from '@/components/shared/product-ui';

export const metadata: Metadata = { title: 'Khoá học của tôi | SkillPath' };

export default function InstructorCoursesPage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Khoá học của tôi</h1>
        <Link
          href="/instructor/courses/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Tạo khoá học mới
        </Link>
      </div>

      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
              <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted-foreground)' }}>Khoá học</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--muted-foreground)' }}>Trạng thái</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: 'var(--muted-foreground)' }}>Học viên</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: 'var(--muted-foreground)' }}>Doanh thu</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--muted-foreground)' }}>Đánh giá</th>
              <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted-foreground)' }}>Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {courses.map((c) => {
              const revenue = Math.floor(c.studentCount * c.price * 0.7);
              const completionPct = 60 + (c.studentCount % 40); // deterministic stand-in for the mock Math.random() (60-99%)
              return (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Image src={c.thumbnail} alt="" width={48} height={32} className="w-12 h-8 object-cover rounded shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-xs" style={{ color: 'var(--foreground)' }}>{c.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${completionPct}%` }} />
                          </div>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{completionPct}% nội dung</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusBadge status={c.id === 'c-3' ? 'pending' : 'approved'} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--foreground)' }}>
                    {c.studentCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                    {revenue.toLocaleString('vi-VN')}₫
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-amber-500">{c.rating}</span>
                      <RatingStars rating={c.rating} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/instructor/courses/${c.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Chỉnh sửa"
                      >
                        <Edit3 size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </Link>
                      <Link
                        href={`/instructor/analytics/revenue`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Xem phân tích"
                      >
                        <BarChart2 size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </Link>
                      <Link
                        href={`/course/${c.slug}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Xem trước"
                      >
                        <Eye size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </Link>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Thêm">
                        <MoreVertical size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
