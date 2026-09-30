'use client';

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourse } from '@/lib/api/instructor-courses';
import type { CourseDetail } from '@/types/instructor-course';

type CourseContextValue = {
  course: CourseDetail;
  setCourse: (course: CourseDetail) => void; // sau khi lưu: cập nhật thanh trên + checklist
  dirty: boolean; // form đang mở có thay đổi chưa lưu
  setDirty: (dirty: boolean) => void;
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function useCourse(): CourseContextValue {
  const value = use(CourseContext);
  if (!value) throw new Error('useCourse phải nằm trong CourseProvider');
  return value;
}

// Form báo trạng thái dirty lên provider; unmount thì reset (provider sống ở layout, không remount khi đổi trang).
export function useDirtySync(isDirty: boolean) {
  const { setDirty } = useCourse();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}

export function ManageSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="h-14 border-b" />
      <div className="flex gap-8 p-6">
        <Skeleton className="hidden h-72 w-64 md:block" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// useParams suspend khi prerender route [id] (cacheComponents) → layout bọc <Suspense>.
export function CourseProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<'not_found' | 'failed' | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(
    () =>
      getCourse(id).then(
        (c) => {
          setCourse(c);
          setError(null);
        },
        (e: unknown) => setError(axios.isAxiosError(e) && e.response?.status === 404 ? 'not_found' : 'failed'),
      ),
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Đóng tab / tải lại khi còn thay đổi chưa lưu (spec §5.3). Link nội bộ do GuardedLink lo.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const value = useMemo(() => (course ? { course, setCourse, dirty, setDirty } : null), [course, dirty]);

  if (error === 'not_found') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-extrabold">Không tìm thấy khoá học</h1>
        <p className="text-sm text-muted-foreground">Khoá học không tồn tại hoặc không thuộc về bạn.</p>
        <Link href="/instructor/courses" className={buttonVariants({ variant: 'outline' })}>
          Về danh sách khoá học
        </Link>
      </main>
    );
  }
  if (error === 'failed') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">Không tải được khoá học.</p>
        <Button
          onClick={() => {
            setError(null);
            void load();
          }}
        >
          Thử lại
        </Button>
      </main>
    );
  }
  if (!value) return <ManageSkeleton />;
  return <CourseContext value={value}>{children}</CourseContext>;
}
