// src/app/instructor/(dashboard)/_components/overview-todo.tsx
import { CheckCircle2, ChevronRight, Mail, MessageSquareText, MessageSquareWarning, TrendingDown, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { InstructorOverview } from '@/types/analytics';
import { Panel } from '../analytics/_components/analytics-shell';

type Item = { key: string; icon: LucideIcon; label: string; sub?: string; href: string };

export function OverviewTodo({ todo }: { todo: InstructorOverview['todo'] }) {
  const { rejectedCourses: rej, unansweredQuestions: q, highRisk: risk } = todo;
  const items: Item[] = [
    rej.count > 0 && {
      key: 'rejected', icon: TriangleAlert, label: `${rej.count} khoá bị từ chối`,
      sub: rej.firstTitle ? `"${rej.firstTitle}" cần chỉnh sửa` : undefined, href: '/instructor/courses',
    },
    q.count > 0 && {
      key: 'qa', icon: MessageSquareText, label: `${q.count} câu hỏi chưa trả lời`,
      sub: q.oldestDays !== null ? `Câu cũ nhất ${q.oldestDays} ngày trước` : undefined, href: '/instructor/qa',
    },
    risk.count > 0 && {
      key: 'risk', icon: TrendingDown, label: `${risk.count} học viên nguy cơ cao`,
      sub: 'Lâu không vào học hoặc chậm hơn bạn cùng lứa',
      href: `/instructor/analytics/students?${risk.topCourseId ? `course=${risk.topCourseId}&` : ''}level=high`,
    },
    todo.lowReviews > 0 && {
      key: 'reviews', icon: MessageSquareWarning, label: `${todo.lowReviews} đánh giá 1–2 sao trong 30 ngày`,
      sub: 'Hỏi thăm học viên', href: '#reviews',
    },
    todo.unreadMessages > 0 && { key: 'msg', icon: Mail, label: `${todo.unreadMessages} tin nhắn chưa đọc`, href: '/instructor/messages' },
  ].filter((x): x is Item => !!x);

  return (
    <Panel title="Cần xử lý">
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-success" aria-hidden /> Không có việc tồn đọng
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map(({ key, icon: Icon, label, sub, href }) => (
            <li key={key}>
              <Link href={href} className="flex min-h-11 items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                <Icon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                </span>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
