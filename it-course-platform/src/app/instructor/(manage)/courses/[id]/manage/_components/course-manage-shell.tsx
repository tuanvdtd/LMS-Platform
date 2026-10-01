'use client';

import { Check, ChevronLeft, Eye, Lock } from 'lucide-react';
import { CourseStatusBadge } from '@/components/shared/course-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChecklistSidebar } from './checklist-sidebar';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

// Toàn màn hình kiểu Udemy (spec C4): thanh trên + sidebar checklist, không dùng layout /instructor.
// Thanh trên luôn tối (cả light/dark mode) để tách khỏi vùng soạn thảo.
export function CourseManageShell({ children }: { children: React.ReactNode }) {
  const { course, dirty } = useCourse();
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <header className="sticky top-0 z-20 flex h-15 items-center gap-3.5 bg-slate-900 pr-4 pl-3 text-slate-50">
        <GuardedLink
          href="/instructor/courses"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Khoá học</span>
        </GuardedLink>
        <div className="h-6 w-px bg-slate-700" aria-hidden />
        <span className="min-w-0 truncate text-[15px] font-semibold">{course.title}</span>
        <CourseStatusBadge status={course.status} />
        <div className="flex-1" />
        {dirty ? (
          <span className="hidden items-center gap-2 text-sm text-orange-300 sm:flex">
            <span className="size-2 rounded-full bg-brand-accent" aria-hidden />
            Có thay đổi chưa lưu
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 text-sm text-slate-400 sm:flex">
            <Check className="size-3.5" />
            Đã lưu mọi thay đổi
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
          disabled
          title="Sắp có"
        >
          <Eye data-icon="inline-start" />
          Xem trước
        </Button>
      </header>
      <div className="grid flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <ChecklistSidebar />
        <main className="min-w-0 px-4 pt-8 pb-16 md:px-8">
          <div className="mx-auto flex max-w-[900px] flex-col gap-6">
            {course.status === 'in_review' && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <Lock />
                <AlertDescription className="text-inherit">
                  Khoá đang chờ duyệt nên tạm khoá chỉnh sửa. Bạn sẽ nhận thông báo khi có kết quả.
                </AlertDescription>
              </Alert>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
