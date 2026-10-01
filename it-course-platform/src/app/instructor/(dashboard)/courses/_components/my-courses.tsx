'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { CourseStatusBadge } from '@/components/shared/course-status-badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { listMyCourses } from '@/lib/api/instructor-courses';
import type { CourseListItem } from '@/types/instructor-course';
import { CreateCourseDialog } from './create-course-dialog';

export function MyCourses() {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listMyCourses().then(setCourses, () => setFailed(true));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Khoá học của tôi</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Tạo khoá mới hoặc hoàn thiện các bản nháp trước khi gửi duyệt.
            </p>
          </div>
          {courses && courses.length > 0 && <CreateCourseDialog />}
        </div>

        {failed ? (
          <p className="text-sm text-destructive">Không tải được danh sách khoá học, thử tải lại trang.</p>
        ) : !courses ? (
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-1" role="status" aria-busy="true" aria-label="Đang tải">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl sm:h-28" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon />
            </div>
            <p className="font-semibold">Bạn chưa có khoá học nào</p>
            <p className="text-sm text-muted-foreground">Bắt đầu bằng một cái tên, phần còn lại soạn dần sau.</p>
            <CreateCourseDialog />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-1">
            {courses.map((c) => (
              <li
                key={c.id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-2.5 sm:flex-row sm:items-center sm:gap-5 sm:p-3.5"
              >
                {c.thumbnailUrl ? (
                  <Image
                    src={c.thumbnailUrl}
                    alt=""
                    width={140}
                    height={79}
                    unoptimized
                    className="aspect-video w-full shrink-0 rounded-lg object-cover sm:w-35"
                  />
                ) : (
                  <div className="flex aspect-video w-full shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted text-muted-foreground sm:w-35">
                    <ImageIcon />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
                    <p className="line-clamp-2 text-sm font-semibold sm:truncate sm:text-base">{c.title}</p>
                    <CourseStatusBadge status={c.status} />
                  </div>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Sửa lần cuối {new Date(c.updatedAt).toLocaleString('vi-VN')}
                  </p>
                  <div className="flex max-w-sm flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                    <Progress value={(c.progress.done / c.progress.total) * 100} className="sm:flex-1" aria-label="Mức hoàn thiện" />
                    <span className="text-[11px] whitespace-nowrap sm:text-xs">
                      Hoàn thiện {c.progress.done}/{c.progress.total} bước
                    </span>
                  </div>
                </div>
                <Link
                  href={`/instructor/courses/${c.id}/manage/goals`}
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-auto w-full sm:mt-0 sm:w-auto')}
                >
                  {c.status === 'draft' ? 'Tiếp tục hoàn thiện' : 'Quản lý'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
