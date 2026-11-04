'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleCheck, CircleDashed, FileUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { getCurriculum } from '@/lib/api/curriculum';
import { createQuestion, deleteQuestion, getQuiz, importQuestions, moveQuestion, updateQuestion, updateQuiz } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import {
  ITEM_TYPE_LABEL,
  lectureOptions,
  type QuestionPayload,
  QUESTION_TYPE_LABEL,
  type QuestionType,
  QUIZ_LIMITS,
  type QuizDetail,
  type QuizMutation,
  type QuizQuestion,
  type UpdateQuizPayload,
} from '@/types/curriculum';
import { useCourse } from '../../../_components/course-provider';
import { ImportQuestionsDialog } from '../../../_components/curriculum/import-questions-dialog';
import { QuestionForm } from '../../../_components/curriculum/question-form';
import { TabMark } from '../../../_components/form-save';
import { GuardedLink } from '../../../_components/guarded-link';
import Loading from '../loading';

const L = QUIZ_LIMITS;

type Lecture = { id: string; title: string };
type Tab = 'questions' | 'settings';
// Câu đang soạn: câu đã lưu, hoặc câu mới chưa lưu (nằm ở chỗ trống đầu tiên của dải số câu).
type Selected = { kind: 'question'; id: string } | { kind: 'new'; type: QuestionType };

const firstOf = (quiz: QuizDetail): Selected =>
  quiz.questions[0] ? { kind: 'question', id: quiz.questions[0].id } : { kind: 'new', type: 'single_choice' };
const same = (a: Selected, b: Selected) => (a.kind === 'new' ? b.kind === 'new' : b.kind === 'question' && a.id === b.id);

// Phần nên bổ sung: học viên thấy giải thích + liên kết bài giảng khi xem lại câu (sau khi nhập CSV câu chưa có bài giảng).
function gapsOf(q: QuizQuestion, hasLectures: boolean) {
  const gaps: string[] = [];
  if (q.options.every((o) => !o.explanation)) gaps.push('giải thích');
  if (hasLectures && !q.relatedItemId) gaps.push('bài giảng liên quan');
  return gaps;
}

// Dòng đầu có chữ (bỏ dòng code fence), gỡ ký hiệu Markdown để hiện chữ thường.
function stemExcerpt(stem: string) {
  const line = stem.split('\n').find((l) => l.trim() && !/^\s*(```|~~~)/.test(l)) ?? '';
  return line.replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/, '').replace(/[*_`~]/g, '').trim();
}

// Trang soạn quiz: dải số câu (tối đa 15) + soạn từng câu một, thay cho danh sách xổ xuống trong khung chương trình.
export function QuizEditor({ courseId, itemId }: { courseId: string; itemId: string }) {
  const [data, setData] = useState<{ quiz: QuizDetail; title: string; lectures: Lecture[] } | null>(null);
  const [error, setError] = useState<'not_found' | 'failed' | null>(null);

  const load = useCallback(
    () =>
      Promise.all([getQuiz(courseId, itemId), getCurriculum(courseId)]).then(
        ([quiz, curriculum]) => {
          const item = curriculum.sections.flatMap((s) => s.items).find((it) => it.id === itemId);
          setData({ quiz, title: item?.title ?? ITEM_TYPE_LABEL.quiz, lectures: lectureOptions(curriculum.sections) });
          setError(null);
        },
        (e: unknown) => setError(axios.isAxiosError(e) && e.response?.status === 404 ? 'not_found' : 'failed'),
      ),
    [courseId, itemId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const back = `/instructor/courses/${courseId}/manage/curriculum`;
  if (error === 'not_found') {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Không tìm thấy quiz</h1>
        <p className="text-sm text-muted-foreground">Quiz không tồn tại hoặc đã bị xoá khỏi khung chương trình.</p>
        <GuardedLink href={back} className={buttonVariants({ variant: 'outline' })}>
          Về khung chương trình
        </GuardedLink>
      </div>
    );
  }
  if (error === 'failed') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">Không tải được quiz.</p>
        <Button onClick={() => void load()}>Thử lại</Button>
      </div>
    );
  }
  if (!data) return <Loading />;
  return <Editor courseId={courseId} itemId={itemId} back={back} title={data.title} lectures={data.lectures} initial={data.quiz} />;
}

function Editor({
  courseId,
  itemId,
  back,
  title,
  lectures,
  initial,
}: {
  courseId: string;
  itemId: string;
  back: string;
  title: string;
  lectures: Lecture[];
  initial: QuizDetail;
}) {
  const { course, patchCourse, dirty, saveRef } = useCourse(); // dirty = form câu đang soạn (chỉ nó báo lên provider)
  const locked = course.status === 'in_review';
  const [quiz, setQuiz] = useState(initial);
  const [tab, setTab] = useState<Tab>('questions');
  const [selected, setSelected] = useState<Selected>(() => firstOf(initial));
  const [pending, setPending] = useState<Selected | null>(null); // câu muốn chuyển tới, chờ xác nhận vì câu đang sửa chưa lưu
  const [switching, setSwitching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importing, setImporting] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const questions = quiz.questions;
  const count = questions.length;
  // Câu đang chọn không còn (xoá/tải lại sau lỗi) → về câu đầu.
  const sel = selected.kind === 'question' && !questions.some((q) => q.id === selected.id) ? firstOf(quiz) : selected;
  const index = sel.kind === 'new' ? count : questions.findIndex((q) => q.id === sel.id);
  const current = sel.kind === 'question' ? questions[index] : undefined;
  const prev = questions[index - 1];
  const next = questions[index + 1];
  const hasLectures = lectures.length > 0;
  const gapCount = questions.filter((q) => gapsOf(q, hasLectures).length > 0).length;
  const after = next ? 'question' : count + (sel.kind === 'new' ? 1 : 0) < L.maxQuestions ? 'new' : null;
  const isNew = sel.kind === 'new';
  const formKey = isNew ? `new-${count}` : sel.id;

  // Hướng lướt khi đổi câu: sang câu sau → thẻ lướt từ phải vào, về câu trước → từ trái;
  // cùng vị trí (vừa lưu câu mới, xoá câu) thì đứng yên. Cập nhật ngay trong render để thẻ mới mount đã có đúng class.
  const [slide, setSlide] = useState({ key: formKey, index, from: '' as '' | 'left' | 'right' });
  if (slide.key !== formKey) {
    setSlide({ key: formKey, index, from: index > slide.index ? 'right' : index < slide.index ? 'left' : '' });
  }

  // Đổi câu: đưa đầu thẻ câu lên (dưới dải số câu dính) và đặt con trỏ vào đề bài nếu là câu mới → gõ liền không cần chuột.
  const cardRef = useRef<HTMLDivElement>(null);
  const shownKey = useRef(formKey);
  useEffect(() => {
    if (shownKey.current === formKey) return;
    shownKey.current = formKey;
    const el = cardRef.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < parseFloat(getComputedStyle(el).scrollMarginTop)) el.scrollIntoView({ block: 'start' });
    if (isNew) el.querySelector('textarea')?.focus({ preventScroll: true });
  }, [formKey, isNew]);

  // Mọi ghi đi qua đây: cập nhật quiz + checklist; lỗi → toast (409 thì khoá trang) và tải lại quiz cho khớp server.
  async function mutate(fn: () => Promise<QuizMutation>, failMessage = 'Lưu thất bại, thử lại') {
    setBusy(true);
    try {
      const res = await fn();
      setQuiz(res.quiz);
      patchCourse({ checklist: res.curriculum.checklist });
      return res.quiz;
    } catch (err) {
      const res = axios.isAxiosError(err) ? err.response : undefined;
      if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
      else toast.error(apiMessage(err, failMessage));
      void getQuiz(courseId, itemId).then(setQuiz, () => {});
      return null;
    } finally {
      setBusy(false);
    }
  }

  const select = (target: Selected) => {
    if (same(target, sel)) return;
    if (dirty) setPending(target);
    else setSelected(target);
  };

  // Dialog đổi câu khi chưa lưu: lưu rồi chuyển (lỗi thì ở lại xem lỗi dưới từng ô), hoặc bỏ thay đổi.
  async function switchTo(save: boolean) {
    if (!pending) return;
    if (save) {
      setSwitching(true);
      const ok = (await saveRef.current?.()) ?? false;
      setSwitching(false);
      if (!ok) {
        setPending(null);
        return;
      }
    }
    setSelected(pending);
    setPending(null);
  }

  // advance: "Lưu & câu tiếp" → câu sau, hết câu thì mở câu mới cùng loại (nếu còn chỗ).
  async function saveQuestion(body: QuestionPayload, advance: boolean) {
    const q = await mutate(() =>
      sel.kind === 'new' ? createQuestion(courseId, itemId, body) : updateQuestion(courseId, itemId, sel.id, body),
    );
    if (!q) return false;
    const i = sel.kind === 'new' ? q.questions.length - 1 : q.questions.findIndex((x) => x.id === sel.id);
    toast.success(`Đã lưu câu ${i + 1}`);
    const following = advance ? q.questions[i + 1] : undefined;
    if (following) setSelected({ kind: 'question', id: following.id });
    else if (advance && q.questions.length < L.maxQuestions) setSelected({ kind: 'new', type: body.type });
    else setSelected({ kind: 'question', id: q.questions[i].id });
    return true;
  }

  async function removeCurrent() {
    setConfirmDelete(false);
    if (!current) return;
    const q = await mutate(() => deleteQuestion(courseId, itemId, current.id));
    if (!q) return;
    toast.success(`Đã xoá câu ${index + 1}`);
    const neighbour = q.questions[Math.min(index, q.questions.length - 1)];
    setSelected(neighbour ? { kind: 'question', id: neighbour.id } : { kind: 'new', type: 'single_choice' });
  }

  async function move(id: string, to: number) {
    const from = questions.findIndex((q) => q.id === id);
    setQuiz({ ...quiz, questions: arrayMove(questions, from, to) });
    await mutate(() => moveQuestion(courseId, itemId, id, to), 'Không đổi được thứ tự');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <GuardedLink
          href={back}
          transitionTypes={['nav-back']}
          className={cn(buttonVariants({ variant: 'ghost' }), '-ml-3 w-fit max-sm:h-11')}
        >
          <ArrowLeft data-icon="inline-start" />
          Khung chương trình
        </GuardedLink>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">{ITEM_TYPE_LABEL.quiz}</p>
            <h1 className="text-2xl font-bold tracking-tight break-words">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {count > 0 ? (
                <Badge className="bg-(--skill-strong-bg) text-foreground">
                  <CircleCheck data-icon="inline-start" />
                  Đã xuất bản
                </Badge>
              ) : (
                <Badge className="bg-(--skill-mid-bg) text-foreground">
                  <CircleDashed data-icon="inline-start" />
                  Chưa xuất bản
                </Badge>
              )}
              {(count === 0 || gapCount > 0) && (
                <p className="text-sm text-muted-foreground">
                  {count === 0
                    ? 'Quiz xuất bản khi có ít nhất 1 câu hỏi.'
                    : `${gapCount}/${count} câu nên bổ sung giải thích hoặc bài giảng liên quan.`}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            className="max-sm:h-11"
            disabled={locked || dirty || count >= L.maxQuestions}
            title={dirty ? 'Lưu câu đang soạn trước khi nhập' : undefined}
            onClick={() => setImporting(true)}
          >
            <FileUp data-icon="inline-start" />
            Nhập từ CSV
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full group-data-horizontal/tabs:h-11 sm:w-fit">
          <TabsTrigger value="questions" className="px-4">
            Câu hỏi
            <span className="text-muted-foreground tabular-nums">
              {count}/{L.maxQuestions}
            </span>
            <TabMark dirty={dirty} />
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-4">
            Cài đặt
            <TabMark dirty={settingsDirty} />
          </TabsTrigger>
        </TabsList>
        {/* keepMounted: đổi tab không mất nội dung đang soạn ở tab kia. */}
        <TabsContent value="questions" keepMounted className="flex flex-col gap-4 pt-2">
          <QuestionStrip
            questions={questions}
            selected={sel}
            dirty={dirty}
            hasLectures={hasLectures}
            sortable={!locked && !busy}
            canAdd={!locked}
            onSelect={select}
            onMove={(id, to) => void move(id, to)}
          />
          {/* scroll-mt: chừa chỗ thanh trên (60px), từ lg thêm dải số câu dính (tới 2 hàng ô).
              overflow-x-clip: thẻ đang lướt vào không làm trang hiện thanh cuộn ngang (clip không chặn sticky). */}
          <div ref={cardRef} className="scroll-mt-20 overflow-x-clip lg:scroll-mt-52">
            <div
              key={formKey}
              className={cn(
                slide.from && 'animate-in duration-200 ease-out fade-in-0 motion-reduce:animate-none',
                slide.from === 'right' && 'slide-in-from-right-8',
                slide.from === 'left' && 'slide-in-from-left-8',
              )}
            >
              <QuestionForm
                question={current}
                newType={sel.kind === 'new' ? sel.type : undefined}
                lectures={lectures}
                locked={locked}
                title={sel.kind === 'new' ? `Câu ${count + 1} (mới)` : `Câu ${index + 1}`}
                after={after}
                onSave={saveQuestion}
                onSkip={() => select(next ? { kind: 'question', id: next.id } : { kind: 'new', type: current?.type ?? 'single_choice' })}
                actions={
                  <div className="flex items-center gap-1">
                    {current && !locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="max-sm:size-11"
                        aria-label={`Xoá câu ${index + 1}`}
                        disabled={busy}
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="max-sm:size-11"
                      aria-label="Câu trước"
                      disabled={!prev}
                      onClick={() => prev && select({ kind: 'question', id: prev.id })}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="max-sm:size-11"
                      aria-label="Câu sau"
                      disabled={!next}
                      onClick={() => next && select({ kind: 'question', id: next.id })}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                }
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" keepMounted className="pt-2">
          <QuizSettings
            key={`${quiz.description}|${quiz.passScorePct}|${quiz.shuffle}`}
            quiz={quiz}
            locked={locked}
            onDirtyChange={setSettingsDirty}
            onSave={async (body) => !!(await mutate(() => updateQuiz(courseId, itemId, body)))}
          />
        </TabsContent>
      </Tabs>

      <ImportQuestionsDialog
        open={importing}
        onOpenChange={setImporting}
        current={count}
        disabled={locked}
        onImport={async (rows) => {
          const q = await mutate(() => importQuestions(courseId, itemId, rows));
          if (!q) return false;
          toast.success(
            `Đã nhập ${rows.length} câu.${hasLectures ? ' Chọn bài giảng liên quan cho các ô màu vàng.' : ''}`,
          );
          if (sel.kind === 'new') setSelected({ kind: 'question', id: q.questions[count].id });
          return true;
        }}
      />

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && !switching && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sel.kind === 'new' ? 'Câu mới chưa lưu' : `Câu ${index + 1} chưa lưu`}</AlertDialogTitle>
            <AlertDialogDescription>Lưu trước khi chuyển câu? Nếu bỏ, nội dung vừa soạn sẽ mất.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={switching}>
              Ở lại
            </AlertDialogCancel>
            <Button variant="destructive" disabled={switching} onClick={() => void switchTo(false)}>
              Bỏ thay đổi
            </Button>
            <Button disabled={switching} onClick={() => void switchTo(true)}>
              {switching ? 'Đang lưu…' : 'Lưu & chuyển'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá câu {index + 1}?</AlertDialogTitle>
            <AlertDialogDescription>
              {current?.answerCount
                ? `Câu này đã có ${current.answerCount} lượt trả lời. Kết quả các lượt làm trước vẫn giữ nguyên.`
                : 'Câu hỏi sẽ bị xoá khỏi quiz.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Huỷ</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void removeCurrent()}>
              Xoá câu
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const slot = 'relative flex size-11 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums';
const focusRing = 'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';
const dirtyDot = <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-brand-accent ring-2 ring-card" />;

const screenReaderInstructions = {
  draggable: 'Enter để mở câu. Space để nhấc ô lên, mũi tên trái/phải để di chuyển, Space để thả, Esc để huỷ.',
};

// Dải 15 ô: câu đã có (đánh số, ô vàng = nên bổ sung), ô câu mới/nút thêm, rồi các chỗ trống viền đứt. Kéo ô để đổi thứ tự.
function QuestionStrip({
  questions,
  selected,
  dirty,
  hasLectures,
  sortable,
  canAdd,
  onSelect,
  onMove,
}: {
  questions: QuizQuestion[];
  selected: Selected;
  dirty: boolean;
  hasLectures: boolean;
  sortable: boolean;
  canAdd: boolean;
  onSelect: (s: Selected) => void;
  onMove: (id: string, to: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Enter để dành cho bấm mở câu; Space nhấc/thả.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );
  const dragged = useRef(false); // vừa kéo xong: bỏ qua cú click đi kèm lúc thả chuột
  const settle = () => setTimeout(() => (dragged.current = false));
  const ids = questions.map((q) => q.id);
  const count = questions.length;
  const canSort = sortable && count > 1;
  const anyGap = questions.some((q) => gapsOf(q, hasLectures).length > 0);

  function onDragEnd({ active, over }: DragEndEvent) {
    settle();
    if (!over || active.id === over.id) return;
    onMove(String(active.id), ids.indexOf(String(over.id)));
  }

  return (
    // Dính dưới thanh trên từ lg (đủ rộng cho 1–2 hàng ô); màn hẹp ô xuống dòng, không dính để khỏi che nửa màn hình.
    <div className="z-10 flex flex-col gap-1.5 rounded-xl border bg-card p-2 lg:sticky lg:top-17">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ screenReaderInstructions }}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={onDragEnd}
        onDragCancel={settle}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <ol aria-label="Các câu hỏi" className="flex flex-wrap gap-1.5 p-1">
            {questions.map((q, i) => (
              <Slot
                key={q.id}
                question={q}
                index={i}
                active={selected.kind === 'question' && selected.id === q.id}
                dirty={dirty}
                gaps={gapsOf(q, hasLectures)}
                sortable={canSort}
                onClick={() => !dragged.current && onSelect({ kind: 'question', id: q.id })}
              />
            ))}
            {count < L.maxQuestions && (
              <li>
                {selected.kind === 'new' ? (
                  <span aria-current="step" className={cn(slot, 'border-primary bg-primary text-primary-foreground')}>
                    {count + 1}
                    <span className="sr-only">: câu mới{dirty ? ', chưa lưu' : ''}</span>
                    {dirty && dirtyDot}
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label="Thêm câu hỏi"
                    title="Thêm câu hỏi"
                    disabled={!canAdd}
                    onClick={() => onSelect({ kind: 'new', type: questions.at(-1)?.type ?? 'single_choice' })}
                    className={cn(
                      slot,
                      focusRing,
                      'cursor-pointer border-dashed border-primary/60 text-primary transition-colors duration-150 hover:bg-(--primary-light) disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <Plus className="size-4" />
                  </button>
                )}
              </li>
            )}
            {Array.from({ length: Math.max(L.maxQuestions - count - 1, 0) }, (_, i) => (
              <li key={i} aria-hidden className={cn(slot, 'border-dashed')} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {(anyGap || canSort) && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pb-0.5 text-xs text-muted-foreground">
          {anyGap && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-sm border border-(--skill-mid) bg-(--skill-mid-bg)" />
              Nên bổ sung giải thích hoặc bài giảng liên quan
            </span>
          )}
          {canSort && <span>Kéo ô số để đổi thứ tự câu</span>}
        </p>
      )}
    </div>
  );
}

function Slot({
  question,
  index,
  active,
  dirty,
  gaps,
  sortable,
  onClick,
}: {
  question: QuizQuestion;
  index: number;
  active: boolean;
  dirty: boolean;
  gaps: string[];
  sortable: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    disabled: !sortable,
  });
  // Nhãn đọc được cả khi rê chuột (title) lẫn trình đọc màn hình: số câu, đầu đề, loại, phần còn thiếu.
  const label = [
    `Câu ${index + 1}: ${stemExcerpt(question.stem)}`,
    QUESTION_TYPE_LABEL[question.type],
    gaps.length ? `thiếu ${gaps.join(', ')}` : '',
    active && dirty ? 'chưa lưu' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10')}
    >
      {/* Không kéo được (khoá/1 câu): bỏ attributes của dnd-kit để nút không bị đánh dấu aria-disabled. */}
      <button
        type="button"
        {...(sortable ? attributes : {})}
        {...listeners}
        aria-label={label}
        title={label}
        aria-current={active ? 'step' : undefined}
        onClick={onClick}
        className={cn(
          slot,
          focusRing,
          'cursor-pointer transition-colors duration-150',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : gaps.length
              ? 'border-(--skill-mid) bg-(--skill-mid-bg) text-foreground hover:border-primary/60'
              : 'bg-background text-foreground hover:border-primary/60',
          isDragging && 'shadow-lg',
        )}
      >
        {index + 1}
        {active && dirty && dirtyDot}
      </button>
    </li>
  );
}

const settingsSchema = z.object({
  description: z.string().max(L.description, `Tối đa ${L.description} ký tự`),
  passScorePct: z.number({ error: 'Nhập số' }).int('Nhập số nguyên').min(0, 'Từ 0 đến 100').max(100, 'Từ 0 đến 100'),
  shuffle: z.boolean(),
});
type Settings = z.infer<typeof settingsSchema>;

// ponytail: cài đặt không báo dirty lên provider (useDirtySync giữ 1 form/lúc, đang dành cho form câu hỏi) —
// rời trang khi cài đặt chưa lưu sẽ không hỏi; chỉ có chấm cam ở tab.
function QuizSettings({
  quiz,
  locked,
  onDirtyChange,
  onSave,
}: {
  quiz: QuizDetail;
  locked: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (body: UpdateQuizPayload) => Promise<boolean>;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      description: quiz.description ?? '',
      passScorePct: quiz.passScorePct,
      shuffle: quiz.shuffle,
    },
  });
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);
  const submit = handleSubmit(async (v) => {
    if (await onSave({ ...v, description: v.description.trim() })) toast.success('Đã lưu cài đặt');
  });

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt quiz</CardTitle>
          <CardDescription>Áp dụng cho mọi câu hỏi trong quiz này.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="quiz-description">Mô tả</FieldLabel>
              <Textarea id="quiz-description" rows={3} maxLength={L.description} {...register('description')} />
              <FieldError errors={[errors.description]} />
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
            </div>
          </fieldset>
        </CardContent>
        {!locked && (
          <CardFooter className="justify-end gap-2">
            {isDirty && (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => reset()}>
                Huỷ thay đổi
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : 'Lưu cài đặt'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
