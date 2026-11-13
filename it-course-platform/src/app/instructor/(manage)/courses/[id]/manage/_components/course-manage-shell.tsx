'use client';

import Link from 'next/link';
import { Check, ChevronLeft, CircleAlert, Eye, Lock } from 'lucide-react';
import { CourseStatusBadge } from '@/components/shared/course-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { ChecklistSidebar } from './checklist-sidebar';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

// Toàn màn hình kiểu Udemy: thanh trên + sidebar checklist, không dùng layout /instructor.
// Thanh trên luôn tối (cả light/dark mode) để tách khỏi vùng soạn thảo.
export function CourseManageShell({ children }: { children: React.ReactNode }) {
  const { course, dirty } = useCourse();
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <header className="sticky top-0 z-20 flex h-15 items-center gap-3.5 bg-ink pr-4 pl-3 text-ink-foreground">
        <GuardedLink
          href="/instructor/courses"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-ink-foreground hover:bg-ink-hover hover:text-white"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Khoá học</span>
        </GuardedLink>
        <div className="h-6 w-px bg-ink-border" aria-hidden />
        <span className="min-w-0 truncate text-[15px] font-semibold">{course.title}</span>
        <CourseStatusBadge status={course.status} />
        <div className="flex-1" />
        {dirty ? (
          <span className="hidden items-center gap-2 text-sm text-brand-accent sm:flex">
            <span className="size-2 rounded-full bg-brand-accent" aria-hidden />
            Có thay đổi chưa lưu
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 text-sm text-ink-muted sm:flex">
            <Check className="size-3.5" />
            Đã lưu mọi thay đổi
          </span>
        )}
        {/* Mở tab mới: trang quản lý (và thay đổi chưa lưu) vẫn còn nguyên. */}
        <Link
          href={`/learn/${course.slug}`}
          target="_blank"
          rel="noopener"
          title="Xem khoá học như học viên"
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'border-ink-border bg-transparent text-ink-foreground hover:bg-ink-hover hover:text-white',
          })}
        >
          <Eye data-icon="inline-start" />
          Xem trước
        </Link>
      </header>
      <div className="grid flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <ChecklistSidebar />
        <main className="min-w-0 px-4 pt-8 pb-16 md:px-8">
          <div className="mx-auto flex max-w-[900px] flex-col gap-6">
            {course.status === 'in_review' && (
              <Alert className="border-warning-border bg-warning-soft text-warning">
                <Lock />
                <AlertDescription className="text-inherit">
                  Khoá đang chờ duyệt nên tạm khoá chỉnh sửa. Bạn sẽ nhận thông báo khi có kết quả.
                </AlertDescription>
              </Alert>
            )}
            {course.status === 'draft' && course.lastReview?.status === 'rejected' && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription className="text-inherit">
                  Khoá học chưa được duyệt: {course.lastReview.reason}. Sửa xong bạn có thể gửi duyệt lại.
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
