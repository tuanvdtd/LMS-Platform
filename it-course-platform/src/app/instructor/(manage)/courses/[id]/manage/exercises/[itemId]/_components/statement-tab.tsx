'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import '@uiw/react-md-editor/markdown-editor.css';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { CourseTopic } from '@/types/instructor-course';
import {
  type Difficulty,
  type ExerciseDetail,
  MAX_HINT,
  MAX_HINTS,
  MAX_INSTRUCTIONS,
  MAX_OBJECTIVE,
  MAX_SOLUTION_EXPLANATION,
  type UpdateExercisePayload,
} from '@/types/exercise';
import { MAX_TOPICS } from '../../../_components/course-topics';

// Editor chỉ chạy ở client (đụng window) → tắt SSR.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full" />,
});

const NONE = 'none';
const DIFFICULTY: Record<Difficulty, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const n = (v: number) => v.toLocaleString('vi-VN');
// BE đếm .length (UTF-16) nên FE cũng vậy.
const text = (max: number) => z.string().max(max, `Tối đa ${n(max)} ký tự`);

export const statementSchema = z.object({
  instructions: text(MAX_INSTRUCTIONS),
  learningObjective: text(MAX_OBJECTIVE),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topicIds: z.array(z.string()).max(MAX_TOPICS, `Tối đa ${MAX_TOPICS} chủ đề`),
  relatedItemId: z.string(),
  hints: z
    .array(z.object({ value: z.string().trim().min(1, 'Nhập gợi ý hoặc xoá ô này').max(MAX_HINT, `Tối đa ${MAX_HINT} ký tự`) }))
    .max(MAX_HINTS, `Tối đa ${MAX_HINTS} gợi ý`),
  solutionExplanation: text(MAX_SOLUTION_EXPLANATION),
});
export type StatementValues = z.infer<typeof statementSchema>;

export const toStatementValues = (ex: ExerciseDetail): StatementValues => ({
  instructions: ex.instructions,
  learningObjective: ex.learningObjective ?? '',
  difficulty: ex.difficulty,
  topicIds: ex.topicIds,
  relatedItemId: ex.relatedItemId ?? NONE,
  hints: ex.hints.map((value) => ({ value })),
  solutionExplanation: ex.solutionExplanation ?? '',
});

export const toStatementPayload = (v: StatementValues): UpdateExercisePayload => ({
  instructions: v.instructions,
  learningObjective: v.learningObjective.trim() || null,
  difficulty: v.difficulty,
  topicIds: v.topicIds,
  relatedItemId: v.relatedItemId === NONE ? null : v.relatedItemId,
  hints: v.hints.map((h) => h.value),
  solutionExplanation: v.solutionExplanation.trim() || null,
});

// Path lỗi 400 của BE → tên field trong form (['hints', '2'] → 'hints.2.value'); null = hiện toast.
export const statementField = (path: string[]): string | null =>
  path[0] === 'hints' && path[1] ? `hints.${path[1]}.value` : (path[0] ?? null);

// Tab "Đề bài" (PATCH): không đổi trạng thái xuất bản.
export function StatementTab({
  form,
  topics,
  lectures,
  locked,
}: {
  form: UseFormReturn<StatementValues>;
  topics: CourseTopic[];
  lectures: { id: string; title: string }[];
  locked: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const hints = useFieldArray({ control, name: 'hints' });
  const lectureItems: Record<string, string> = { [NONE]: 'Không', ...Object.fromEntries(lectures.map((l) => [l.id, l.title])) };
  const hintsError = errors.hints?.message ?? errors.hints?.root?.message;

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.instructions}>
        <FieldLabel htmlFor="exercise-instructions">Đề bài</FieldLabel>
        <FieldDescription>Nêu rõ yêu cầu, định dạng input/output và ràng buộc. Hỗ trợ Markdown, tối đa {n(MAX_INSTRUCTIONS)} ký tự.</FieldDescription>
        <Controller
          control={control}
          name="instructions"
          render={({ field }) => (
            <div className="quiz-md" data-color-mode={colorMode}>
              <MDEditor
                value={field.value}
                onChange={(v) => field.onChange(v ?? '')}
                preview="edit"
                height={360}
                textareaProps={{
                  id: 'exercise-instructions',
                  placeholder: 'Ví dụ: Cho dãy n số nguyên, in ra tổng các số chẵn.',
                  maxLength: MAX_INSTRUCTIONS,
                }}
                components={{ preview: (source) => <Markdown>{source}</Markdown> }}
              />
            </div>
          )}
        />
        <FieldError errors={[errors.instructions]} />
      </Field>

      <Field data-invalid={!!errors.learningObjective}>
        <FieldLabel htmlFor="exercise-objective">Mục tiêu</FieldLabel>
        <Input
          id="exercise-objective"
          maxLength={MAX_OBJECTIVE}
          placeholder="Ví dụ: Dùng vòng lặp để duyệt mảng"
          aria-invalid={!!errors.learningObjective}
          {...register('learningObjective')}
        />
        <FieldError errors={[errors.learningObjective]} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="exercise-difficulty">Độ khó</FieldLabel>
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <Select items={DIFFICULTY} value={field.value} onValueChange={(v) => v && field.onChange(v)} disabled={locked}>
                <SelectTrigger id="exercise-difficulty" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
                      <SelectItem key={d} value={d}>
                        {DIFFICULTY[d]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field data-invalid={!!errors.relatedItemId}>
          <FieldLabel htmlFor="exercise-related">Bài giảng liên quan</FieldLabel>
          <Controller
            control={control}
            name="relatedItemId"
            render={({ field }) => (
              <Select items={lectureItems} value={field.value} onValueChange={(v) => v && field.onChange(v)} disabled={locked}>
                <SelectTrigger id="exercise-related" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(lectureItems).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.relatedItemId]} />
        </Field>
      </div>

      <FieldSet data-invalid={!!errors.topicIds}>
        <FieldLegend variant="label">Chủ đề đánh giá</FieldLegend>
        <FieldDescription>Điểm bài này tính vào mức thành thạo của học viên ở các chủ đề được chọn (tối đa {MAX_TOPICS}).</FieldDescription>
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Khoá học chưa có chủ đề. Thêm ở trang Thông tin cơ bản.</p>
        ) : (
          <Controller
            control={control}
            name="topicIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-x-6">
                {topics.map((t) => (
                  <label key={t.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value.includes(t.id)}
                      disabled={locked || (!field.value.includes(t.id) && field.value.length >= MAX_TOPICS)}
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
        <FieldError errors={[errors.topicIds]} />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">
          Gợi ý ({hints.fields.length}/{MAX_HINTS})
        </FieldLegend>
        <FieldDescription>Học viên mở dần từng gợi ý theo thứ tự khi bí. Mỗi gợi ý tối đa {MAX_HINT} ký tự.</FieldDescription>
        <ol className="flex flex-col gap-3">
          {hints.fields.map((f, i) => {
            const error = errors.hints?.[i]?.value;
            return (
              <li key={f.id} className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <Textarea
                    rows={2}
                    maxLength={MAX_HINT}
                    aria-label={`Gợi ý ${i + 1}`}
                    placeholder={`Gợi ý ${i + 1}`}
                    aria-invalid={!!error}
                    className="flex-1"
                    {...register(`hints.${i}.value`)}
                  />
                  <div className="flex shrink-0 flex-col sm:flex-row">
                    <IconButton label={`Đưa gợi ý ${i + 1} lên`} disabled={i === 0} onClick={() => hints.swap(i, i - 1)}>
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      label={`Đưa gợi ý ${i + 1} xuống`}
                      disabled={i === hints.fields.length - 1}
                      onClick={() => hints.swap(i, i + 1)}
                    >
                      <ArrowDown />
                    </IconButton>
                    <IconButton label={`Xoá gợi ý ${i + 1}`} onClick={() => hints.remove(i)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                </div>
                <FieldError errors={[error]} />
              </li>
            );
          })}
        </ol>
        <FieldError errors={hintsError ? [{ message: hintsError }] : []} />
        <div>
          <Button
            type="button"
            variant="outline"
            className="max-sm:h-11"
            disabled={hints.fields.length >= MAX_HINTS}
            onClick={() => hints.append({ value: '' })}
          >
            <Plus data-icon="inline-start" /> Thêm gợi ý
          </Button>
        </div>
      </FieldSet>

      <Field data-invalid={!!errors.solutionExplanation}>
        <FieldLabel htmlFor="exercise-explanation">Giải thích lời giải</FieldLabel>
        <FieldDescription>Học viên chỉ thấy sau khi làm đúng bài (Accepted). Tối đa {n(MAX_SOLUTION_EXPLANATION)} ký tự.</FieldDescription>
        <Controller
          control={control}
          name="solutionExplanation"
          render={({ field }) => (
            <div className="quiz-md" data-color-mode={colorMode}>
              <MDEditor
                value={field.value}
                onChange={(v) => field.onChange(v ?? '')}
                preview="edit"
                height={240}
                textareaProps={{
                  id: 'exercise-explanation',
                  placeholder: 'Ý tưởng, độ phức tạp, lỗi hay gặp…',
                  maxLength: MAX_SOLUTION_EXPLANATION,
                }}
                components={{ preview: (source) => <Markdown>{source}</Markdown> }}
              />
            </div>
          )}
        />
        <FieldError errors={[errors.solutionExplanation]} />
      </Field>
    </FieldGroup>
  );
}

export function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground max-sm:size-11"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
