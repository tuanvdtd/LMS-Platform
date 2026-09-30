'use client';

import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COURSE_STATUS_LABEL } from '@/types/instructor-course';
import { ChecklistSidebar } from './checklist-sidebar';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

// Toàn màn hình kiểu Udemy (spec C4): thanh trên + sidebar checklist, không dùng layout /instructor.
export function CourseManageShell({ children }: { children: React.ReactNode }) {
  const { course } = useCourse();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
        <GuardedLink href="/instructor/courses" className="flex shrink-0 items-center gap-1 text-sm font-medium hover:text-primary">
          <ArrowLeft size={16} /> Quay lại khoá học
        </GuardedLink>
        <span className="min-w-0 truncate font-bold">{course.title}</span>
        <Badge variant="secondary">{COURSE_STATUS_LABEL[course.status]}</Badge>
        <Button variant="outline" size="sm" className="ml-auto" disabled title="Sắp có">
          Xem trước
        </Button>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <ChecklistSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {course.status === 'in_review' && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Khoá học đang chờ duyệt, không sửa được
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
