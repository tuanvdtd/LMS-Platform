'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteItem, updateItem } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import type { CurriculumItem } from '@/types/curriculum';
import { useCourse } from '../course-provider';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { InlineTitle } from './inline-title';
import { LectureDetailPanel } from './lecture-detail-panel';

const DONE = 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300';

function chipOf(item: CurriculumItem): { text: string; className: string } {
  if (item.type !== 'lecture') return { text: 'Chưa xuất bản', className: 'bg-muted text-muted-foreground' };
  if (item.lectureKind === 'video') return { text: `Video · ${Math.round(item.durationSec / 60)} phút`, className: DONE };
  if (item.lectureKind === 'document') return { text: 'PDF', className: DONE };
  return { text: 'Chưa có nội dung', className: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
}

// label: "Bài giảng 3" — đánh số theo loại trên cả khoá, tính ở CurriculumEditor.
export function ItemRow({ item, label }: { item: CurriculumItem; label: string }) {
  const { courseId, locked, busy, run, openItemId, toggleItem, confirm } = useCurriculum();
  const { dirty } = useCourse();
  const open = openItemId === item.id;
  // Kéo sang phần khác sẽ remount ItemRow → panel đang dirty/đang tải sẽ mất, nên chặn kéo.
  const dragLocked = locked || (open && dirty);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item' },
    disabled: dragLocked || busy,
  });
  const chip = chipOf(item);

  const remove = () => {
    const go = () => void run(() => deleteItem(courseId, item.id));
    const unsaved = open && dirty;
    if (item.lectureKind || item.resources.length || unsaved) {
      confirm(
        `Xoá "${label}: ${item.title}"?${unsaved ? ' Thay đổi chưa lưu sẽ mất.' : ''} File PDF vẫn còn trong thư viện.`,
        go,
      );
    } else go();
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('rounded-lg border bg-background', isDragging && 'relative z-10 opacity-70 shadow-lg')}
    >
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 sm:flex-nowrap">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${label}`} disabled={dragLocked} {...attributes} {...listeners} />
        <span className="shrink-0 text-sm font-semibold">{label}:</span>
        <InlineTitle
          className="min-w-40"
          value={item.title}
          label={`Tên ${label}`}
          disabled={locked}
          onSave={(title) => run(() => updateItem(courseId, item.id, { title }))}
        />
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', chip.className)}>
          {chip.text}
        </span>
        {item.type === 'lecture' ? (
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => toggleItem(item.id)}>
            Nội dung
            <ChevronDown data-icon="inline-end" className={cn('transition-transform', open && 'rotate-180')} />
          </Button>
        ) : (
          <Button variant="outline" size="xs" disabled title="Sắp có (đợt 4)">
            {item.type === 'coding_exercise' ? 'Mở trình soạn' : 'Soạn câu hỏi'} · đợt 4
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label={`Xoá ${label}`} disabled={locked} onClick={remove}>
          <Trash2 />
        </Button>
      </div>
      {open && <LectureDetailPanel item={item} />}
    </li>
  );
}
