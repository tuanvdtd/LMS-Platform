'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { type FieldValues, type Path, useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CircleAlert, CircleCheck, CircleDashed, Loader2, ShieldCheck } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiMessage } from '@/lib/api/checkout';
import { getCurriculum } from '@/lib/api/curriculum';
import { getExercise, updateExercise, updateExerciseCode, verifyExercise } from '@/lib/api/exercise';
import { cn } from '@/lib/utils';
import { ITEM_TYPE_LABEL } from '@/types/curriculum';
import type { ExerciseDetail, VerifyReport } from '@/types/exercise';
import { flashAnchor, useCourse, useDirtySync } from '../../../_components/course-provider';
import { submitToPromise } from '../../../_components/form-save';
import { GuardedLink } from '../../../_components/guarded-link';
import Loading from '../loading';
import { CodeTab, codeField, codeSchema, type CodeValues, toCodePayload, toCodeValues } from './code-tab';
import {
  StatementTab,
  statementField,
  statementSchema,
  type StatementValues,
  toStatementPayload,
  toStatementValues,
} from './statement-tab';
import { VerifyReportView } from './verify-report';

type Lecture = { id: string; title: string };
type Tab = 'statement' | 'code';

// Trang soạn bài code. Tải bài + danh sách bài giảng (cho ô "Bài giảng liên quan").
export function ExerciseEditor({ courseId, itemId }: { courseId: string; itemId: string }) {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [error, setError] = useState<'not_found' | 'failed' | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);

  const load = useCallback(
    () =>
      getExercise(courseId, itemId).then(
        (ex) => {
          setExercise(ex);
          setError(null);
        },
        (e: unknown) => setError(axios.isAxiosError(e) && e.response?.status === 404 ? 'not_found' : 'failed'),
      ),
    [courseId, itemId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getCurriculum(courseId).then(
      (res) =>
        setLectures(
          res.sections
            .flatMap((s) => s.items)
            .filter((it) => it.type === 'lecture')
            .map((it, i) => ({ id: it.id, title: `${ITEM_TYPE_LABEL.lecture} ${i + 1}: ${it.title}` })),
        ),
      () => toast.error('Không tải được danh sách bài giảng'),
    );
  }, [courseId]);

  const back = `/instructor/courses/${courseId}/manage/curriculum`;
  if (error === 'not_found') {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Không tìm thấy bài tập</h1>
        <p className="text-sm text-muted-foreground">Bài tập không tồn tại hoặc đã bị xoá khỏi khung chương trình.</p>
        <GuardedLink href={back} className={buttonVariants({ variant: 'outline' })}>
          Về khung chương trình
        </GuardedLink>
      </div>
    );
  }
  if (error === 'failed') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">Không tải được bài tập.</p>
        <Button onClick={() => void load()}>Thử lại</Button>
      </div>
    );
  }
  if (!exercise) return <Loading />;
  return <Editor courseId={courseId} itemId={itemId} initial={exercise} lectures={lectures} back={back} />;
}

type ApiFieldError = { path: string[]; message: string };

function Editor({
  courseId,
  itemId,
  initial,
  lectures,
  back,
}: {
  courseId: string;
  itemId: string;
  initial: ExerciseDetail;
  lectures: Lecture[];
  back: string;
}) {
  const { course, patchCourse } = useCourse();
  const locked = course.status === 'in_review';
  const [exercise, setExercise] = useState(initial);
  const [tab, setTab] = useState<Tab>('statement');
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const statement = useForm<StatementValues>({ resolver: zodResolver(statementSchema), defaultValues: toStatementValues(initial) });
  const code = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: toCodeValues(initial) });
  const statementDirty = statement.formState.isDirty;
  const codeDirty = code.formState.isDirty;

  // 400 → lỗi dưới từng ô theo path; path không gắn được ô nào / lỗi khác → toast message của BE.
  function failSave<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, toField: (path: string[]) => string | null) {
    const res = axios.isAxiosError(err) ? err.response : undefined;
    if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
    const fieldErrors: ApiFieldError[] = res?.status === 400 ? (res.data?.errors ?? []) : [];
    let unmapped = fieldErrors.length === 0;
    for (const e of fieldErrors) {
      const name = toField(e.path);
      if (name) setError(name as Path<T>, { message: e.message });
      else unmapped = true;
    }
    if (unmapped) toast.error(apiMessage(err, 'Lưu thất bại, thử lại'));
  }

  async function saveStatement(values: StatementValues): Promise<boolean> {
    try {
      const { exercise: ex } = await updateExercise(courseId, itemId, toStatementPayload(values));
      setExercise(ex);
      statement.reset(toStatementValues(ex));
      toast.success('Đã lưu đề bài');
      return true;
    } catch (err) {
      failSave(err, statement.setError, statementField);
      return false;
    }
  }

  async function saveCode(values: CodeValues): Promise<boolean> {
    try {
      const { exercise: ex } = await updateExerciseCode(courseId, itemId, toCodePayload(values));
      const wasPublished = exercise.isPublished;
      setExercise(ex);
      code.reset(toCodeValues(ex));
      setReport(null); // báo cáo cũ không còn đúng với code/test mới
      toast.success(wasPublished ? 'Đã lưu code & test — bài đã gỡ xuất bản, hãy kiểm tra lại lời giải' : 'Đã lưu code & test');
      return true;
    } catch (err) {
      failSave(err, code.setError, (path) => codeField(path, values.languages));
      return false;
    }
  }

  const saveCodeForm = code.handleSubmit(saveCode);

  // "Lưu & tiếp tục" của dialog rời trang: lưu form nào đang có thay đổi; lỗi ở tab nào thì mở tab đó.
  // Bài đang xuất bản: không lưu code thẳng mà ở lại trang, mở dialog xác nhận gỡ xuất bản (trả false → provider đóng dialog rời trang).
  async function saveAll() {
    if (statementDirty && !(await submitToPromise(statement.handleSubmit, saveStatement)())) {
      setTab('statement');
      return false;
    }
    if (codeDirty && exercise.isPublished) {
      setTab('code');
      void code.handleSubmit(() => setConfirmUnpublish(true))();
      return false;
    }
    if (codeDirty && !(await submitToPromise(code.handleSubmit, saveCode)())) {
      setTab('code');
      return false;
    }
    return true;
  }
  useDirtySync(statementDirty || codeDirty, saveAll, () => {
    statement.reset();
    code.reset();
  });

  async function verify() {
    setVerifying(true);
    try {
      const r = await verifyExercise(courseId, itemId);
      setReport(r);
      if (r.passed) setExercise((e) => ({ ...e, isPublished: true }));
      // verify không trả bài → tải lại để cập nhật trạng thái xuất bản.
      await getExercise(courseId, itemId).then(setExercise, () => {});
    } catch (err) {
      const res = axios.isAxiosError(err) ? err.response : undefined;
      if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
      toast.error(apiMessage(err, 'Không kiểm tra được lời giải, thử lại'));
    } finally {
      setVerifying(false);
    }
  }

  // "Dùng output này": điền output thật vào test trong form (chưa lưu), mở tab Code & test và nháy viền test đó.
  function applyOutput(testCaseId: string, stdout: string) {
    const index = code.getValues('tests').findIndex((t) => t.testId === testCaseId);
    if (index < 0) {
      toast.error('Test này không còn trong form');
      return;
    }
    code.setValue(`tests.${index}.expectedOutput`, stdout, { shouldDirty: true, shouldValidate: true });
    setTab('code');
    flashAnchor(`test-${testCaseId}`);
  }

  const statementError = Object.keys(statement.formState.errors).length > 0;
  const codeError = Object.keys(code.formState.errors).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <GuardedLink href={back} className={cn(buttonVariants({ variant: 'ghost' }), '-ml-3 w-fit max-sm:h-11')}>
          <ArrowLeft data-icon="inline-start" />
          Khung chương trình
        </GuardedLink>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">{ITEM_TYPE_LABEL.coding_exercise}</p>
            <h1 className="text-2xl font-bold tracking-tight break-words">{exercise.title}</h1>
            {exercise.isPublished ? (
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
          </div>
          <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:max-w-72 sm:items-end">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={locked || codeDirty || verifying}
              aria-busy={verifying || undefined}
              onClick={() => void verify()}
            >
              {verifying ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin motion-reduce:animate-none" />
                  Đang chạy lời giải…
                </>
              ) : (
                <>
                  <ShieldCheck data-icon="inline-start" />
                  Kiểm tra lời giải & xuất bản
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground sm:text-right" aria-live="polite">
              {codeDirty
                ? 'Lưu Code & test trước khi kiểm tra.'
                : verifying
                  ? 'Có thể mất tới vài chục giây với nhiều test.'
                  : 'Chạy lời giải mẫu với mọi test; pass hết thì bài được xuất bản.'}
            </p>
          </div>
        </div>
      </div>

      {report && (
        <VerifyReportView report={report} tests={exercise.tests} onUseOutput={applyOutput} onClose={() => setReport(null)} />
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full group-data-horizontal/tabs:h-11 sm:w-fit">
          <TabsTrigger value="statement" className="px-4">
            Đề bài
            <TabMark dirty={statementDirty} error={statementError} />
          </TabsTrigger>
          <TabsTrigger value="code" className="px-4">
            Code & test
            <TabMark dirty={codeDirty} error={codeError} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="statement" className="pt-2">
          <form onSubmit={statement.handleSubmit(saveStatement)} noValidate className="flex flex-col gap-4">
            <Card>
              <CardContent>
                <fieldset disabled={locked} className="min-w-0">
                  <StatementTab form={statement} topics={course.topics} lectures={lectures} locked={locked} />
                </fieldset>
              </CardContent>
            </Card>
            <SaveFooter
              label="Lưu đề bài"
              dirty={statementDirty}
              submitting={statement.formState.isSubmitting}
              locked={locked}
              onDiscard={() => statement.reset()}
            />
          </form>
        </TabsContent>
        <TabsContent value="code" className="pt-2">
          <form
            onSubmit={exercise.isPublished ? code.handleSubmit(() => setConfirmUnpublish(true)) : saveCodeForm}
            noValidate
            className="flex flex-col gap-4"
          >
            <Card>
              <CardContent>
                <fieldset disabled={locked} className="min-w-0">
                  <CodeTab form={code} locked={locked} />
                </fieldset>
              </CardContent>
            </Card>
            <SaveFooter
              label="Lưu code & test"
              dirty={codeDirty}
              submitting={code.formState.isSubmitting}
              locked={locked}
              onDiscard={() => code.reset()}
            />
          </form>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmUnpublish} onOpenChange={setConfirmUnpublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lưu code & test?</AlertDialogTitle>
            <AlertDialogDescription>
              Lưu sẽ gỡ xuất bản bài này cho tới khi kiểm tra lại lời giải. Tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Huỷ</AlertDialogCancel>
            <Button
              onClick={() => {
                setConfirmUnpublish(false);
                void saveCodeForm();
              }}
            >
              Lưu & gỡ xuất bản
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TabMark({ dirty, error }: { dirty: boolean; error: boolean }) {
  if (error) {
    return (
      <>
        <CircleAlert className="text-destructive" aria-hidden />
        <span className="sr-only">(có lỗi)</span>
      </>
    );
  }
  if (!dirty) return null;
  return (
    <>
      <span className="size-2 rounded-full bg-brand-accent" aria-hidden />
      <span className="sr-only">(chưa lưu)</span>
    </>
  );
}

// Thanh lưu dính đáy của từng tab; khoá đang chờ duyệt thì ẩn (banner khoá đã hiện ở shell).
function SaveFooter({
  label,
  dirty,
  submitting,
  locked,
  onDiscard,
}: {
  label: string;
  dirty: boolean;
  submitting: boolean;
  locked: boolean;
  onDiscard: () => void;
}) {
  if (locked) return null;
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-card p-2.5 shadow-lg">
      <span className="mr-auto flex items-center gap-2 pl-1.5 text-sm text-muted-foreground">
        {dirty && <span className="size-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />}
        {dirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}
      </span>
      {dirty && (
        <Button type="button" variant="ghost" className="max-sm:h-11" disabled={submitting} onClick={onDiscard}>
          Huỷ thay đổi
        </Button>
      )}
      <Button type="submit" className="max-sm:h-11" disabled={!dirty || submitting}>
        {submitting ? 'Đang lưu…' : label}
      </Button>
    </div>
  );
}
