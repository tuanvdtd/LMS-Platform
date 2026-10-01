'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, BarChart2, User,
  ChevronLeft, ChevronRight, DollarSign, Activity, FileCheck, Users,
  ShieldCheck, ChevronDown, BookMarked, MessageCircle, MessagesSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const INSTRUCTOR_NAV = [
  { icon: LayoutDashboard, label: 'Tổng quan', to: '/instructor' },
  { icon: BookOpen, label: 'Khoá học', to: '/instructor/courses' },
  { icon: MessageCircle, label: 'Hỏi đáp (Q&A)', to: '/instructor/qa' },
  { icon: MessagesSquare, label: 'Tin nhắn riêng', to: '/instructor/messages' },
  {
    icon: BarChart2,
    label: 'Phân tích',
    to: '/instructor/analytics',
    children: [
      { icon: DollarSign, label: 'Doanh thu', to: '/instructor/analytics/revenue' },
      { icon: Activity, label: 'Hành vi học', to: '/instructor/analytics/engagement' },
      { icon: FileCheck, label: 'Chất lượng bài kiểm', to: '/instructor/analytics/assessments' },
      { icon: Users, label: 'Học viên', to: '/instructor/analytics/students' },
    ],
  },
  { icon: User, label: 'Hồ sơ giảng viên', to: '/instructor/profile' },
  { icon: ShieldCheck, label: 'Xác minh', to: '/instructor/verification' },
];

export default function InstructorSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className="hidden shrink-0 flex-col border-r transition-all duration-200 lg:flex"
      style={{
        width: collapsed ? 56 : 220,
        background: 'var(--card)',
        borderColor: 'var(--border)',
        minHeight: 'calc(100vh - 56px)',
      }}
    >
      <div className="flex-1 py-3 overflow-y-auto">
        {INSTRUCTOR_NAV.map((item) => {
          // '/instructor' is the dashboard root, so it must match exactly or it would stay active everywhere
          const isActive = pathname === item.to || (item.to !== '/instructor' && pathname.startsWith(item.to + '/'));
          const Icon = item.icon;

          if (item.children) {
            const anyActive = item.children.some((c) => pathname.startsWith(c.to));
            return (
              <div key={item.to}>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 rounded-none px-3 py-2.5"
                  style={{ color: anyActive ? 'var(--primary)' : 'var(--foreground)' }}
                  onClick={() => setAnalyticsOpen((o) => !o)}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${analyticsOpen ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </Button>
                {!collapsed && analyticsOpen && (
                  <div className="ml-4 border-l pl-2" style={{ borderColor: 'var(--border)' }}>
                    {item.children.map((child) => {
                      const CIcon = child.icon;
                      const cActive = pathname.startsWith(child.to);
                      return (
                        <Link
                          key={child.to}
                          href={child.to}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                          style={{
                            color: cActive ? 'var(--primary)' : 'var(--muted-foreground)',
                            background: cActive ? 'var(--primary-light)' : 'transparent',
                          }}
                        >
                          <CIcon size={14} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.to}
              href={item.to}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mx-1.5 transition-colors"
              style={{
                color: isActive ? 'var(--primary)' : 'var(--foreground)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Switch to student */}
      {!collapsed && (
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:underline"
          >
            <BookMarked size={13} />
            Chuyển sang Học viên
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        onClick={() => setCollapsed((c) => !c)}
        className="h-10 rounded-none border-t"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </Button>
    </aside>
  );
}
