'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, CircleHelp, ClipboardCheck, CodeXml, FileText, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteItem, updateItem } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import { type CurriculumItem, formatDuration, type ItemType } from '@/types/curriculum';
import { useCourse } from '../course-provider';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { InlineTitle } from './inline-title';
import { LectureDetailPanel } from './lecture-detail-panel';

// Icon + màu nền theo loại mục (bài giảng PDF dùng icon tài liệu).
export const TYPE_ICON: Record<ItemType, { icon: typeof Play; className: string }> = {
  lecture: { icon: Play, className: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300' },
  quiz: { icon: CircleHelp, className: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300' },
  practice_test: { icon: ClipboardCheck, className: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300' },
  coding_exercise: { icon: CodeXml, className: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300' },
};

const DONE = 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300';
const TODO = 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300';
const IDLE = 'border-transparent bg-muted text-muted-foreground';

function chipOf(item: CurriculumItem): { text: string; className: string } {
  if (item.type !== 'lecture') return { text: 'Chưa xuất bản', className: IDLE };
  if (item.lectureKind === 'video') return { text: `Video · ${formatDuration(item.durationSec)}`, className: DONE };
  if (item.lectureKind === 'document') return { text: 'PDF', className: DONE };
  return { text: 'Chưa có nội dung', className: TODO };
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
  const { icon: Icon, className: iconClass } = TYPE_ICON[item.type];
  const TypeIcon = item.lectureKind === 'document' ? FileText : Icon;

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
      className={cn('group bg-card', isDragging && 'relative z-10 rounded-lg opacity-80 shadow-lg')}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 py-2 pr-3 pl-2 sm:flex-nowrap">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${label}`} disabled={dragLocked} {...attributes} {...listeners} />
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', iconClass)} aria-hidden>
          <TypeIcon className="size-4" />
        </span>
        <span className="shrink-0 text-[13px] font-medium text-muted-foreground">{label}:</span>
        <InlineTitle
          className="min-w-40"
          value={item.title}
          label={`Tên ${label}`}
          disabled={locked}
          onSave={(title) => run(() => updateItem(courseId, item.id, { title }))}
        />
        <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold', chip.className)}>
          {chip.text}
        </span>
        {item.type === 'lecture' ? (
          <Button variant="outline" size="sm" aria-expanded={open} onClick={() => toggleItem(item.id)}>
            {item.lectureKind ? (
              <>
                Nội dung
                <ChevronDown data-icon="inline-end" className={cn('transition-transform', open && 'rotate-180')} />
              </>
            ) : (
              <>
                <Plus data-icon="inline-start" />
                Nội dung
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled title="Sắp có (đợt 4)">
            {item.type === 'coding_exercise' ? 'Soạn bài tập' : 'Soạn câu hỏi'}
          </Button>
        )}
        {/* Desktop: hiện khi hover/focus cho gọn; màn cảm ứng (không hover) luôn hiện. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Xoá ${label}`}
          disabled={locked}
          onClick={remove}
          className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Trash2 />
        </Button>
      </div>
      {open && <LectureDetailPanel item={item} />}
    </li>
  );
}
