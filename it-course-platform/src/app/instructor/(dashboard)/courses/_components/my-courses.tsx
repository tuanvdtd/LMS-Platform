'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { listMyCourses } from '@/lib/api/instructor-courses';
import { COURSE_STATUS_LABEL, type CourseListItem } from '@/types/instructor-course';
import { CreateCourseDialog } from './create-course-dialog';

export function MyCourses() {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listMyCourses().then(setCourses, () => setFailed(true));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Khoá học của tôi</h1>
        {courses && courses.length > 0 && <CreateCourseDialog />}
      </div>

      {failed ? (
        <p className="text-sm text-destructive">Không tải được danh sách khoá học, thử tải lại trang.</p>
      ) : !courses ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-label="Đang tải">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <p className="font-semibold">Bạn chưa có khoá học nào</p>
          <p className="text-sm text-muted-foreground">Bắt đầu bằng một cái tên, phần còn lại soạn dần sau.</p>
          <CreateCourseDialog />
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {courses.map((c) => (
            <li key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              {c.thumbnailUrl ? (
                <Image
                  src={c.thumbnailUrl}
                  alt=""
                  width={96}
                  height={54}
                  unoptimized
                  className="h-[54px] w-24 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-[54px] w-24 shrink-0 items-center justify-center rounded bg-muted">
                  <ImageIcon size={20} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{c.title}</p>
                  <Badge variant={c.status === 'published' ? 'default' : 'secondary'}>
                    {COURSE_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(c.progress.done / c.progress.total) * 100}
                    className="max-w-48"
                    aria-label="Mức hoàn thiện"
                  />
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    Hoàn thiện {c.progress.done}/{c.progress.total} mục
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sửa lần cuối {new Date(c.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <Link
                href={`/instructor/courses/${c.id}/manage/goals`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Chỉnh sửa
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
