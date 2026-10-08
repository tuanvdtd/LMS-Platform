'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, TriangleAlert } from 'lucide-react';
import { z } from 'zod';
import '@uiw/react-md-editor/markdown-editor.css';
import { Markdown } from '@/components/markdown';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type QuestionPayload, QUESTION_TYPE_LABEL, type QuestionType, QUIZ_LIMITS, type QuizQuestion } from '@/types/curriculum';
import { useDirtySync } from '../course-provider';
import { submitToPromise } from '../form-save';

// Editor chỉ chạy ở client (đụng window) → tắt SSR.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const NONE = 'none';
const L = QUIZ_LIMITS;
const schema = z
  .object({
    type: z.enum(['single_choice', 'multiple_choice']),
    stem: z.string().trim().min(1, 'Nhập đề bài').max(L.stem, `Tối đa ${L.stem} ký tự`),
    relatedItemId: z.string(),
    options: z
      .array(
        z.object({
          content: z.string().trim().min(1, 'Nhập nội dung đáp án').max(L.option, `Tối đa ${L.option} ký tự`),
          isCorrect: z.boolean(),
          explanation: z.string().max(L.explanation, `Tối đa ${L.explanation} ký tự`),
        }),
      )
      .min(L.minOptions, `Cần ít nhất ${L.minOptions} đáp án`)
      .max(L.maxOptions, `Tối đa ${L.maxOptions} đáp án`),
  })
  .superRefine((q, ctx) => {
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (q.type === 'single_choice' && correct !== 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn đúng 1 đáp án đúng' });
    }
    if (q.type === 'multiple_choice' && correct < 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Chọn ít nhất 1 đáp án đúng' });
    }
  });
type Values = z.infer<typeof schema>;

const emptyOption = { content: '', isCorrect: false, explanation: '' };
const toValues = (q: QuizQuestion | undefined, type: QuestionType): Values =>
  q
    ? {
        type: q.type,
        stem: q.stem,
        relatedItemId: q.relatedItemId ?? NONE,
        options: q.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, explanation: o.explanation ?? '' })),
      }
    : { type, stem: '', relatedItemId: NONE, options: [emptyOption, emptyOption] };

// Form một câu hỏi (spec quiz-authoring §5): lưu từng câu, gửi đủ đề + toàn bộ đáp án.
export function QuestionForm({
  question,
  newType = 'single_choice',
  lectures,
  disabled,
  onSave,
  onCancel,
}: {
  question?: QuizQuestion;
  newType?: QuestionType; // loại chọn lúc tạo; khi sửa lấy từ question (không đổi được)
  lectures: { id: string; title: string }[];
  disabled: boolean;
  onSave: (body: QuestionPayload) => Promise<boolean>;
  onCancel: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const [openExplain, setOpenExplain] = useState<Set<number>>(new Set());
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(question, newType) });
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const type = useWatch({ control, name: 'type' });
  const options = useWatch({ control, name: 'options' });

  async function onSubmit(values: Values): Promise<boolean> {
    const ok = await onSave({
      type: values.type,
      stem: values.stem.trim(),
      relatedItemId: values.relatedItemId === NONE ? null : values.relatedItemId,
      options: values.options.map((o) => ({
        content: o.content.trim(),
        isCorrect: o.isCorrect,
        explanation: o.explanation.trim() || null,
      })),
    });
    if (ok) reset(values);
    return ok;
  }
  useDirtySync(isDirty, submitToPromise(handleSubmit, onSubmit), () => reset());

  // Một đáp án: chọn 1 thì bỏ các đáp án còn lại.
  const markOnly = (index: number) =>
    options.forEach((_, j) => setValue(`options.${j}.isCorrect`, j === index, { shouldDirty: true }));
  const toggleExplain = (i: number) =>
    setOpenExplain((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const optionsError = errors.options?.message ?? errors.options?.root?.message;
  const lectureItems = [{ value: NONE, label: 'Không chọn' }, ...lectures.map((l) => ({ value: l.id, label: l.title }))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border bg-background p-4">
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
        {question && question.answerCount > 0 && (
          <Alert>
            <TriangleAlert />
            Câu này đã có {question.answerCount} lượt trả lời. Sửa sẽ áp dụng cho các lượt làm sau, kết quả cũ giữ nguyên.
          </Alert>
        )}

        <Field data-invalid={!!errors.stem}>
          <FieldLabel>
            Đề bài <Badge variant="secondary">{QUESTION_TYPE_LABEL[type]}</Badge>
          </FieldLabel>
          <Controller
            control={control}
            name="stem"
            render={({ field }) => (
              <div className="quiz-md" data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
                <MDEditor
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? '')}
                  preview="edit"
                  height={220}
                  textareaProps={{ placeholder: 'Nhập đề bài. Dùng nút </> để chèn code.', maxLength: L.stem }}
                  components={{ preview: (source) => <Markdown>{source}</Markdown> }}
                />
              </div>
            )}
          />
          <FieldError errors={[errors.stem]} />
        </Field>

        <Field data-invalid={!!optionsError}>
          <FieldLabel>Đáp án ({type === 'single_choice' ? 'chọn 1 đáp án đúng' : 'chọn các đáp án đúng'})</FieldLabel>
          <div className="flex flex-col gap-3">
            {fields.map((f, i) => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  {type === 'single_choice' ? (
                    <RadioGroup className="w-auto" value={options[i]?.isCorrect ? 'y' : ''} onValueChange={() => markOnly(i)}>
                      <RadioGroupItem value="y" aria-label={`Đáp án ${i + 1} đúng`} />
                    </RadioGroup>
                  ) : (
                    <Controller
                      control={control}
                      name={`options.${i}.isCorrect`}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          aria-label={`Đáp án ${i + 1} đúng`}
                        />
                      )}
                    />
                  )}
                  <Input
                    {...register(`options.${i}.content`)}
                    placeholder={`Đáp án ${i + 1}`}
                    maxLength={L.option}
                    aria-invalid={!!errors.options?.[i]?.content}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggleExplain(i)}>
                    Giải thích
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá đáp án ${i + 1}`}
                    disabled={fields.length <= L.minOptions}
                    onClick={() => {
                      remove(i);
                      setOpenExplain(new Set());
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <FieldError errors={[errors.options?.[i]?.content]} />
                {(openExplain.has(i) || options[i]?.explanation) && (
                  <div className="flex items-center gap-2">
                    <span className="size-4 shrink-0" aria-hidden /> {/* chiếm đúng chỗ ô chọn ở hàng trên → thẳng cột với ô nội dung */}
                    <Input
                      {...register(`options.${i}.explanation`)}
                      placeholder="Vì sao đáp án này đúng/sai (không bắt buộc)"
                      maxLength={L.explanation}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <FieldError errors={optionsError ? [{ message: optionsError }] : []} />
          {/* Field ép con trực tiếp w-full (*:w-full) → bọc div để nút giữ độ rộng tự nhiên. */}
          <div>
            <Button type="button" variant="outline" size="sm" disabled={fields.length >= L.maxOptions} onClick={() => append(emptyOption)}>
              <Plus data-icon="inline-start" /> Thêm đáp án
            </Button>
          </div>
        </Field>

        <Field>
          <FieldLabel>Bài giảng liên quan</FieldLabel>
          <Controller
            control={control}
            name="relatedItemId"
            render={({ field }) => (
              <Select items={lectureItems} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lectureItems.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu câu hỏi'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
