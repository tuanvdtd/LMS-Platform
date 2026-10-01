'use client';

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourse } from '@/lib/api/instructor-courses';
import type { CourseDetail } from '@/types/instructor-course';

type CourseContextValue = {
  course: CourseDetail;
  setCourse: (course: CourseDetail) => void; // sau khi lưu: cập nhật thanh trên + checklist
  patchCourse: (patch: Partial<CourseDetail>) => void; // ghi đè vài trường (checklist sau khi sửa khung chương trình, status khi 409)
  dirty: boolean; // form đang mở có thay đổi chưa lưu
  setDirty: (dirty: boolean) => void;
  saveRef: React.RefObject<SaveFn | null>; // form đang mở đăng ký hàm lưu, dùng cho "Lưu & tiếp tục"
  discardRef: React.RefObject<DiscardFn | null>; // và hàm reset, dùng cho "Bỏ thay đổi"
  requestLeave: (href: string) => void; // GuardedLink gọi khi còn thay đổi chưa lưu
};

type SaveFn = () => Promise<boolean>;
type DiscardFn = () => Promise<void>; // resolve khi form đã render lại xong sau reset()

const CourseContext = createContext<CourseContextValue | null>(null);

export function useCourse(): CourseContextValue {
  const value = use(CourseContext);
  if (!value) throw new Error('useCourse phải nằm trong CourseProvider');
  return value;
}

// Form báo trạng thái dirty + hàm lưu/huỷ lên provider; unmount thì reset (provider sống ở layout, không remount khi đổi trang).
// Huỷ trả Promise, resolve sau khi commit render isDirty=false: cacheComponents ẩn trang cũ bằng React Activity ngay
// khi chuyển trang, lúc đó effect của react-hook-form (useFieldArray) bị dừng → phải đợi reset áp xong mới navigate.
export function useDirtySync(isDirty: boolean, save: SaveFn, discard: () => void) {
  const { setDirty, saveRef, discardRef } = useCourse();
  const discarded = useRef<(() => void) | null>(null);
  useEffect(() => {
    setDirty(isDirty);
    if (!isDirty) {
      discarded.current?.();
      discarded.current = null;
    }
    return () => setDirty(false);
  }, [isDirty, setDirty]);
  useEffect(() => {
    saveRef.current = save;
    discardRef.current = () =>
      new Promise<void>((resolve) => {
        if (!isDirty) return resolve();
        discarded.current = resolve;
        discard();
      });
    return () => {
      saveRef.current = null;
      discardRef.current = null;
    };
  });
}

// Checklist bấm vào một mục thiếu → cuộn tới ô và nháy viền (CSS [data-flash] ở globals.css).
// Ô có thể chưa render khi vừa đổi trang nên thử lại vài lần.
export function flashAnchor(id: string, tries = 20) {
  const el = document.getElementById(id);
  if (!el) {
    if (tries > 0) setTimeout(() => flashAnchor(id, tries - 1), 50);
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.dataset.flash = '';
  setTimeout(() => delete el.dataset.flash, 1600);
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const saveRef = useRef<SaveFn | null>(null);
  const discardRef = useRef<DiscardFn | null>(null);
  const router = useRouter();
  const patchCourse = useCallback(
    (patch: Partial<CourseDetail>) => setCourse((c) => (c ? { ...c, ...patch } : c)),
    [],
  );

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

  const value = useMemo(
    () =>
      course
        ? { course, setCourse, patchCourse, dirty, setDirty, saveRef, discardRef, requestLeave: setPendingHref }
        : null,
    [course, dirty, patchCourse],
  );

  async function leave(save: boolean) {
    const href = pendingHref;
    if (!href) return;
    if (save) {
      setLeaving(true);
      const ok = (await saveRef.current?.()) ?? false;
      setLeaving(false);
      if (!ok) {
        setPendingHref(null); // lưu lỗi: ở lại để thấy lỗi dưới từng ô
        return;
      }
    } else {
      await discardRef.current?.();
    }
    setDirty(false);
    setPendingHref(null);
    router.push(href);
    const anchor = href.split('#')[1];
    if (anchor) flashAnchor(anchor);
  }

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
  return (
    <CourseContext value={value}>
      {children}
      <AlertDialog open={!!pendingHref} onOpenChange={(open) => !open && !leaving && setPendingHref(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời trang khi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>Các thay đổi trên trang này sẽ mất nếu bạn rời đi mà không lưu.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={leaving}>
              Ở lại
            </AlertDialogCancel>
            <Button variant="destructive" disabled={leaving} onClick={() => void leave(false)}>
              Bỏ thay đổi
            </Button>
            <Button disabled={leaving} onClick={() => void leave(true)}>
              {leaving ? 'Đang lưu…' : 'Lưu & tiếp tục'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CourseContext>
  );
}
