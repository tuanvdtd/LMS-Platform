'use client';

import { useCallback, useEffect, useState } from 'react';
import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { createQuestion, deleteQuestion, getQuiz, moveQuestion, updateQuestion, updateQuiz } from '@/lib/api/quiz';
import {
  type CurriculumItem,
  type QuestionPayload,
  QUESTION_TYPE_LABEL,
  QUIZ_LIMITS,
  type QuizDetail,
  type QuizMutation,
  type QuestionType,
  type QuizQuestion,
} from '@/types/curriculum';
import { useCourse } from '../course-provider';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { QuestionForm } from './question-form';

// Đang mở form: tạo mới (loại chọn lúc tạo, sửa không đổi được) hoặc sửa câu có sẵn; null = không mở form nào.
type Editing = { kind: 'new'; type: QuestionType } | { kind: 'edit'; id: string } | null;

// Soạn quiz tại chỗ (spec 2026-10-08-quiz-authoring §5). Mọi ghi đi qua run(): lỗi xử lý chung, cây cập nhật chip.
export function QuizDetailPanel({ item }: { item: CurriculumItem }) {
  const { courseId, locked, busy, run, confirm, lectures } = useCurriculum();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

  const load = useCallback(
    () =>
      getQuiz(courseId, item.id).then(
        (q) => {
          setQuiz(q);
          setFailed(false);
        },
        () => setFailed(true),
      ),
    [courseId, item.id],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (fn: () => Promise<QuizMutation>) => {
    const ok = await run(async () => {
      const res = await fn();
      setQuiz(res.quiz);
      return res.curriculum;
    });
    if (!ok) void load(); // lỗi 404/400/409: đồng bộ lại state cục bộ
    return ok;
  };

  if (failed) {
    return (
      <div className="flex items-center gap-3 border-t px-4 py-4 text-sm text-muted-foreground">
        Không tải được quiz. <Button size="sm" variant="outline" onClick={() => void load()}>Thử lại</Button>
      </div>
    );
  }
  if (!quiz) return <Skeleton className="m-4 h-32" />;

  const saveQuestion = (id: string | null) => async (body: QuestionPayload) => {
    const ok = await save(() =>
      id === null ? createQuestion(courseId, item.id, body) : updateQuestion(courseId, item.id, id, body),
    );
    if (ok) {
      setEditing(null);
      toast.success('Đã lưu câu hỏi');
    }
    return ok;
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 border-t px-4 py-4">
      <QuizSettings
        key={`${quiz.description}|${quiz.passScorePct}|${quiz.shuffle}|${quiz.topicIds.join()}`}
        quiz={quiz}
        disabled={locked}
        onSave={(body) => save(() => updateQuiz(courseId, item.id, body))}
      />
      <QuestionList
        quiz={quiz}
        editing={editing}
        disabled={locked}
        busy={busy}
        onEdit={setEditing}
        onDelete={(q, index) =>
          confirm(`Xoá câu ${index + 1}?`, () => void save(() => deleteQuestion(courseId, item.id, q.id)))
        }
        onMove={async (q, index, optimistic) => {
          setQuiz(optimistic);
          await save(() => moveQuestion(courseId, item.id, q.id, index));
        }}
        renderForm={(q) => (
          <QuestionForm
            question={q}
            newType={editing?.kind === 'new' ? editing.type : undefined}
            lectures={lectures}
            disabled={locked}
            onSave={saveQuestion(q?.id ?? null)}
            onCancel={() => setEditing(null)}
          />
        )}
      />
    </div>
  );
}

const settingsSchema = z.object({
  description: z.string().max(QUIZ_LIMITS.description, `Tối đa ${QUIZ_LIMITS.description} ký tự`),
  passScorePct: z.number({ error: 'Nhập số' }).int('Nhập số nguyên').min(0, 'Từ 0 đến 100').max(100, 'Từ 0 đến 100'),
  shuffle: z.boolean(),
  topicIds: z.array(z.string()),
});
type Settings = z.infer<typeof settingsSchema>;

// ponytail: form cài đặt không báo dirty lên provider (chỉ form câu hỏi báo) — useDirtySync giữ 1 form/lúc.
function QuizSettings({
  quiz,
  disabled,
  onSave,
}: {
  quiz: QuizDetail;
  disabled: boolean;
  onSave: (body: Settings) => Promise<boolean>;
}) {
  const { course } = useCourse();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      description: quiz.description ?? '',
      passScorePct: quiz.passScorePct,
      shuffle: quiz.shuffle,
      topicIds: quiz.topicIds,
    },
  });
  const submit = handleSubmit(async (v) => {
    if (await onSave({ ...v, description: v.description.trim() })) toast.success('Đã lưu cài đặt');
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm font-semibold">Cài đặt</p>
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="quiz-description">Mô tả</FieldLabel>
          <Textarea id="quiz-description" rows={2} maxLength={QUIZ_LIMITS.description} {...register('description')} />
          <FieldError errors={[errors.description]} />
        </Field>
        <Field>
          <FieldLabel>Chủ đề đánh giá</FieldLabel>
          {course.topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Khoá học chưa có chủ đề. Thêm ở trang Thông tin cơ bản.</p>
          ) : (
            <Controller
              control={control}
              name="topicIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-4">
                  {course.topics.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(t.id)}
                        onCheckedChange={(on) =>
                          field.onChange(on ? [...field.value, t.id] : field.value.filter((id) => id !== t.id))
                        }
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              )}
            />
          )}
        </Field>
        <div className="flex flex-wrap items-end gap-6">
          <Field data-invalid={!!errors.passScorePct} className="w-40">
            <FieldLabel htmlFor="quiz-pass">Điểm đạt (%)</FieldLabel>
            <Input id="quiz-pass" type="number" min={0} max={100} {...register('passScorePct', { valueAsNumber: true })} />
            <FieldError errors={[errors.passScorePct]} />
          </Field>
          <Controller
            control={control}
            name="shuffle"
            render={({ field }) => (
              <label className="flex items-center gap-2 pb-2 text-sm">
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                Xáo thứ tự câu hỏi và đáp án
              </label>
            )}
          />
          <Button type="submit" size="sm" className="ml-auto" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu cài đặt'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

function QuestionList({
  quiz,
  editing,
  disabled,
  busy,
  onEdit,
  onDelete,
  onMove,
  renderForm,
}: {
  quiz: QuizDetail;
  editing: Editing;
  disabled: boolean;
  busy: boolean;
  onEdit: (e: Editing) => void;
  onDelete: (q: QuizQuestion, index: number) => void;
  onMove: (q: QuizQuestion, index: number, optimistic: QuizDetail) => Promise<void>;
  renderForm: (q?: QuizQuestion) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = quiz.questions.map((q) => q.id);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    void onMove(quiz.questions[from], to, { ...quiz, questions: arrayMove(quiz.questions, from, to) });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Câu hỏi ({quiz.questions.length})</p>
      {quiz.questions.length === 0 && editing?.kind !== 'new' && (
        <p className="text-sm text-muted-foreground">Chưa có câu hỏi. Quiz chỉ xuất bản khi có ít nhất 1 câu.</p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {quiz.questions.map((q, i) =>
              editing?.kind === 'edit' && editing.id === q.id ? (
                <li key={q.id}>{renderForm(q)}</li>
              ) : (
                <QuestionRow
                  key={q.id}
                  question={q}
                  index={i}
                  dragDisabled={disabled || busy || editing !== null}
                  disabled={disabled}
                  onEdit={() => onEdit({ kind: 'edit', id: q.id })}
                  onDelete={() => onDelete(q, i)}
                />
              ),
            )}
          </ol>
        </SortableContext>
      </DndContext>
      {editing?.kind === 'new' ? (
        renderForm()
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="self-start" disabled={disabled || editing !== null} />}
          >
            <Plus data-icon="inline-start" /> Câu hỏi <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((type) => (
              <DropdownMenuItem key={type} onClick={() => onEdit({ kind: 'new', type })}>
                {QUESTION_TYPE_LABEL[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function QuestionRow({
  question,
  index,
  dragDisabled,
  disabled,
  onEdit,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  dragDisabled: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
    id: question.id,
    disabled: dragDisabled,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="flex items-center gap-2 rounded-lg border bg-card py-2 pr-2 pl-1"
    >
      <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ câu ${index + 1}`} disabled={dragDisabled} {...attributes} {...listeners} />
      <span className="shrink-0 text-sm font-medium">Câu {index + 1}:</span>
      <span className="min-w-0 flex-1 truncate text-sm">{stemExcerpt(question.stem)}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{QUESTION_TYPE_LABEL[question.type]}</span>
      <Button variant="ghost" size="icon-sm" aria-label={`Sửa câu ${index + 1}`} disabled={dragDisabled} onClick={onEdit}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Xoá câu ${index + 1}`} disabled={disabled} onClick={onDelete}>
        <Trash2 />
      </Button>
    </li>
  );
}

// Dòng đầu có chữ (bỏ dòng code fence), gỡ ký hiệu Markdown để danh sách hiện chữ thường.
function stemExcerpt(stem: string) {
  const line = stem.split('\n').find((l) => l.trim() && !/^\s*(```|~~~)/.test(l)) ?? '';
  return line.replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/, '').replace(/[*_`~]/g, '').trim();
}
