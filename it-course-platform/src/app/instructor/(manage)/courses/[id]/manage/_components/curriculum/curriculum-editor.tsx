'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  type Announcements,
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurriculum, moveItem, moveSection } from '@/lib/api/curriculum';
import {
  type CurriculumResponse,
  type CurriculumSection,
  ITEM_TYPE_LABEL,
  type ItemType,
  MIN_PUBLISHED_LECTURES,
  MIN_VIDEO_MINUTES,
} from '@/types/curriculum';
import { useCourse } from '../course-provider';
import { PageHeader } from '../form-save';
import { AddSectionForm } from './add-forms';
import { CurriculumContext, type CurriculumContextValue } from './curriculum-context';
import { SectionCard } from './section-card';

// Kéo phần: chỉ va chạm với phần. Kéo mục: va chạm cả mục lẫn phần (thả được vào phần rỗng).
const collision: CollisionDetection = (args) =>
  args.active.data.current?.type === 'section'
    ? closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'section'),
      })
    : closestCorners(args);

const findSection = (list: CurriculumSection[], id: string) =>
  list.find((s) => s.id === id || s.items.some((i) => i.id === id));

const screenReaderInstructions = {
  draggable: 'Nhấn Space để nhấc lên. Dùng phím mũi tên để di chuyển, Space để thả, Esc để huỷ.',
};
const announcements: Announcements = {
  onDragStart: () => 'Đã nhấc lên.',
  onDragOver: ({ over }) => (over ? 'Đang ở vị trí mới.' : 'Ngoài vùng thả.'),
  onDragEnd: ({ over }) => (over ? 'Đã thả, đang lưu.' : 'Đã huỷ, trả về chỗ cũ.'),
  onDragCancel: () => 'Đã huỷ, trả về chỗ cũ.',
};

// Trang Khung chương trình (spec curriculum-upload §5): ghi ngay từng thao tác (K5), không có thanh Lưu.
export function CurriculumEditor() {
  const { course, patchCourse, dirty } = useCourse();
  const courseId = course.id;
  const locked = course.status === 'in_review';
  const [sections, setSections] = useState<CurriculumSection[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState(0);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; action: () => void } | null>(null);
  const beforeDrag = useRef<CurriculumSection[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const apply = useCallback(
    (res: CurriculumResponse) => {
      setSections(res.sections);
      patchCourse({ checklist: res.checklist });
    },
    [patchCourse],
  );

  const reload = useCallback(
    () =>
      getCurriculum(courseId).then(
        (res) => {
          apply(res);
          setLoadFailed(false);
        },
        () => setLoadFailed(true),
      ),
    [courseId, apply],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Lỗi theo spec §6: 409 → khoá trang (banner ở shell); 404 → tải lại cây; 400 → câu lỗi đầu; còn lại → toast.
  const run = useCallback<CurriculumContextValue['run']>(
    async (fn, failMessage = 'Lưu thất bại, thử lại') => {
      setPending((n) => n + 1);
      try {
        apply(await fn());
        return true;
      } catch (err) {
        const res = axios.isAxiosError(err) ? err.response : undefined;
        if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
        else if (res?.status === 404) {
          toast.error('Không tìm thấy, đã tải lại khung chương trình');
          void reload();
        } else if (res?.status === 400) toast.error(res.data?.errors?.[0]?.message ?? 'Dữ liệu không hợp lệ');
        else toast.error(res?.status === 502 ? 'Lưu trữ đang lỗi, thử lại' : failMessage);
        return false;
      } finally {
        setPending((n) => n - 1);
      }
    },
    [apply, patchCourse, reload],
  );

  // Panel đang có thay đổi chưa lưu (dirty do useDirtySync của panel báo lên) → hỏi trước khi đóng/đổi panel.
  const toggleItem = useCallback(
    (id: string) => {
      if (dirty && !window.confirm('Bỏ thay đổi chưa lưu ở bài giảng đang mở?')) return;
      setOpenItemId((cur) => (cur === id ? null : id));
    },
    [dirty],
  );

  const ctx = useMemo<CurriculumContextValue>(
    () => ({
      courseId,
      locked,
      busy: pending > 0,
      run,
      openItemId,
      toggleItem,
      confirm: (message, action) => setPendingConfirm({ message, action }),
    }),
    [courseId, locked, pending, run, openItemId, toggleItem],
  );

  // "Bài giảng 3" — đếm theo loại trên cả khoá, theo thứ tự hiển thị.
  const labels = useMemo(() => {
    const count: Partial<Record<ItemType, number>> = {};
    const map = new Map<string, string>();
    for (const s of sections ?? []) {
      for (const it of s.items) {
        count[it.type] = (count[it.type] ?? 0) + 1;
        map.set(it.id, `${ITEM_TYPE_LABEL[it.type]} ${count[it.type]}`);
      }
    }
    return map;
  }, [sections]);

  const stats = useMemo(() => {
    let lectures = 0;
    let seconds = 0;
    for (const s of sections ?? []) {
      for (const it of s.items) {
        if (it.type !== 'lecture' || !it.isPublished) continue;
        lectures++;
        if (it.lectureKind === 'video') seconds += it.durationSec;
      }
    }
    return { lectures, minutes: Math.floor(seconds / 60) };
  }, [sections]);

  if (loadFailed) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">Không tải được khung chương trình.</p>
        <Button onClick={() => void reload()}>Thử lại</Button>
      </div>
    );
  }
  if (!sections) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const current = sections;

  // Kéo mục sang phần khác: chuyển ngay trong state để danh sách đích mở chỗ.
  function onDragOver({ active, over }: DragOverEvent) {
    if (active.data.current?.type !== 'item' || !over) return;
    setSections((prev) => {
      if (!prev) return prev;
      const from = findSection(prev, String(active.id));
      const to =
        over.data.current?.type === 'section' ? prev.find((s) => s.id === over.id) : findSection(prev, String(over.id));
      if (!from || !to || from.id === to.id) return prev;
      const item = from.items.find((i) => i.id === active.id);
      if (!item) return prev;
      // Theo ví dụ multi-container của dnd-kit: chèn trước/sau `over` tuỳ mục đang kéo ở nửa trên/dưới.
      const overIndex = to.items.findIndex((i) => i.id === over.id);
      const translated = active.rect.current.translated;
      const below = !!translated && translated.top > over.rect.top + over.rect.height / 2;
      const at = overIndex < 0 ? (below ? to.items.length : 0) : overIndex + (below ? 1 : 0);
      return prev.map((s) => {
        if (s.id === from.id) return { ...s, items: s.items.filter((i) => i.id !== active.id) };
        if (s.id === to.id) return { ...s, items: [...s.items.slice(0, at), item, ...s.items.slice(at)] };
        return s;
      });
    });
  }

  // Thả: cập nhật state ngay (optimistic) rồi gọi move; lỗi → trả cây trước khi kéo (spec §5.2).
  function onDragEnd({ active, over }: DragEndEvent) {
    const before = beforeDrag.current;
    beforeDrag.current = null;
    if (!before) return;
    if (!over) {
      setSections(before);
      return;
    }
    const id = String(active.id);
    let next: CurriculumSection[];
    let call: () => Promise<CurriculumResponse>;
    if (active.data.current?.type === 'section') {
      const from = current.findIndex((s) => s.id === id);
      const to = current.findIndex((s) => s.id === over.id);
      if (to < 0 || from === to) return;
      next = arrayMove(current, from, to);
      call = () => moveSection(courseId, id, to);
    } else {
      const section = findSection(current, id);
      const origin = findSection(before, id);
      if (!section || !origin) return;
      const from = section.items.findIndex((i) => i.id === id);
      const overIndex = section.items.findIndex((i) => i.id === over.id);
      const to = overIndex < 0 ? from : overIndex;
      if (origin.id === section.id && origin.items.findIndex((i) => i.id === id) === to) {
        setSections(before);
        return;
      }
      next = current.map((s) => (s.id === section.id ? { ...s, items: arrayMove(s.items, from, to) } : s));
      call = () => moveItem(courseId, id, section.id, to);
    }
    setSections(next);
    void run(call, 'Không đổi được thứ tự').then((ok) => {
      if (!ok) setSections(before);
    });
  }

  const list = (
    <DndContext
      id="curriculum-dnd"
      sensors={sensors}
      collisionDetection={collision}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={({ active }) => {
        beforeDrag.current = current;
        // Panel mở (không dirty — dirty thì ItemRow đã chặn kéo) → đóng cho gọn khi kéo.
        if (active.id === openItemId) setOpenItemId(null);
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        if (beforeDrag.current) setSections(beforeDrag.current);
        beforeDrag.current = null;
      }}
    >
      <SortableContext items={current.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {current.map((s, i) => (
            <SectionCard key={s.id} section={s} index={i} labels={labels} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <CurriculumContext value={ctx}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Khung chương trình"
            description="Chia khoá thành các phần, mỗi phần gồm bài giảng, trắc nghiệm, bài thi thử hoặc bài tập coding. Mọi thay đổi được lưu ngay."
          />
          {/* Kéo thả / đổi tên / xoá không có nút để quay → báo tạm ở đây; lỗi đã toast. */}
          {pending > 0 && (
            <span className="flex shrink-0 items-center gap-1.5 pt-2 text-xs text-muted-foreground" aria-live="polite">
              <Loader2 className="size-3.5 animate-spin" />
              Đang lưu…
            </span>
          )}
        </div>
        <div
          id="curriculum"
          className="grid scroll-mt-20 gap-4 rounded-xl border bg-card p-4 transition-shadow sm:grid-cols-2"
        >
          <Meter label="Bài giảng đã có nội dung" value={stats.lectures} goal={MIN_PUBLISHED_LECTURES} unit="bài giảng" />
          <Meter
            label="Tổng thời lượng video"
            value={stats.minutes}
            goal={MIN_VIDEO_MINUTES}
            unit="phút"
          />
        </div>
        {list}
        <AddSectionForm />
      </div>
      <AlertDialog open={!!pendingConfirm} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận</AlertDialogTitle>
            <AlertDialogDescription>{pendingConfirm?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Huỷ</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                pendingConfirm?.action();
                setPendingConfirm(null);
              }}
            >
              Đồng ý
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CurriculumContext>
  );
}

function Meter({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold">
          {label} · cần ≥ {goal}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {value}/{goal} {unit}
        </span>
      </div>
      <Progress
        value={Math.min(100, (value / goal) * 100)}
        aria-label={label}
        className="[&_[data-slot=progress-indicator]]:bg-green-500"
      />
    </div>
  );
}
