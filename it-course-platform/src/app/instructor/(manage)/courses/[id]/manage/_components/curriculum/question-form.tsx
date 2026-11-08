'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, TriangleAlert } from 'lucide-react';
import '@uiw/react-md-editor/markdown-editor.css';
import { Markdown } from '@/components/markdown';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type QuestionPayload, QUESTION_TYPE_LABEL, type QuestionType, QUIZ_LIMITS, type QuizQuestion } from '@/types/curriculum';
import { useDirtySync } from '../course-provider';
import { submitToPromise } from '../form-save';
import { NONE, questionSchema, type QuestionValues as Values, toPayload } from './question-schema';

// Editor chỉ chạy ở client (đụng window) → tắt SSR.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const L = QUIZ_LIMITS;

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

// Form một câu hỏi: lưu từng câu, gửi đủ đề + toàn bộ đáp án.
// after: sau câu này là câu đã có ("question"), chỗ trống cho câu mới ("new"), hay hết chỗ (null).
export function QuestionForm({
  question,
  newType = 'single_choice',
  lectures,
  locked,
  title,
  actions,
  after,
  onSave,
  onSkip,
  dirty,
}: {
  question?: QuizQuestion;
  newType?: QuestionType; // loại mặc định của câu mới; câu đã lưu không đổi loại được (BE chặn)
  lectures?: { id: string; title: string }[]; // undefined → ẩn ô "Bài giảng liên quan" (ngân hàng câu kỹ năng không gắn bài giảng)
  locked: boolean;
  title: string;
  actions: React.ReactNode;
  after: 'question' | 'new' | null;
  onSave: (body: QuestionPayload, advance: boolean) => Promise<boolean>;
  onSkip: () => void; // sang câu sau khi không có gì để lưu
  dirty?: boolean; // thay đổi nằm ngoài form này (vd Select độ khó của ngân hàng kỹ năng) → vẫn cho lưu
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
  } = useForm<Values>({ resolver: zodResolver(questionSchema), defaultValues: toValues(question, newType) });
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const type = useWatch({ control, name: 'type' });
  const options = useWatch({ control, name: 'options' });

  async function submit(values: Values, advance: boolean): Promise<boolean> {
    const ok = await onSave(toPayload(values), advance);
    if (ok) reset(values);
    return ok;
  }
  useDirtySync(isDirty, submitToPromise(handleSubmit, (v) => submit(v, false)), () => reset());

  const save = handleSubmit((v) => submit(v, false));
  const pending = isDirty || !!dirty || !question; // câu mới luôn phải lưu mới sang câu sau
  const advance = () => (pending ? void handleSubmit((v) => submit(v, true))() : onSkip());
  const advanceLabel =
    after === 'question' ? (pending ? 'Lưu & câu tiếp' : 'Câu tiếp') : after === 'new' ? (pending ? 'Lưu & thêm câu' : 'Thêm câu') : null;

  // Ctrl/⌘+S lưu, Ctrl/⌘+Enter lưu rồi sang câu sau: soạn liền nhiều câu không cần chuột.
  function onKeyDown(e: React.KeyboardEvent) {
    if (locked || isSubmitting || !(e.ctrlKey || e.metaKey)) return;
    if (e.key === 's') {
      e.preventDefault();
      void save();
    } else if (e.key === 'Enter' && advanceLabel) {
      e.preventDefault();
      advance();
    }
  }

  // Một đáp án: chọn 1 thì bỏ các đáp án còn lại (index -1 = bỏ hết).
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
  const lectureItems = [{ value: NONE, label: 'Không chọn' }, ...(lectures ?? []).map((l) => ({ value: l.id, label: l.title }))];

  return (
    <form onSubmit={save} onKeyDown={onKeyDown} noValidate className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          {actions}
        </CardHeader>
        <CardContent>
          <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
            {question && question.answerCount > 0 && (
              <Alert>
                <TriangleAlert />
                Câu này đã có {question.answerCount} lượt trả lời. Sửa sẽ áp dụng cho các lượt làm sau, kết quả cũ giữ nguyên.
              </Alert>
            )}

            <Field>
              <FieldLabel id="question-type">Loại câu hỏi</FieldLabel>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <ToggleGroup
                    variant="outline"
                    spacing={0}
                    aria-labelledby="question-type"
                    value={[field.value]}
                    disabled={locked || !!question}
                    onValueChange={(v) => {
                      const next = v[0] as QuestionType | undefined;
                      if (!next) return; // bấm lại nút đang chọn: giữ nguyên
                      if (next === 'single_choice') markOnly(options.findIndex((o) => o.isCorrect));
                      field.onChange(next);
                    }}
                  >
                    {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                      // Nền muted mặc định của Toggle quá nhạt để nhận ra loại đang chọn → dùng tông xanh như đáp án đã chọn bên học viên.
                      <ToggleGroupItem key={t} value={t} className="px-4 aria-pressed:bg-(--primary-light) aria-pressed:text-primary">
                        {QUESTION_TYPE_LABEL[t]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
              {question && <FieldDescription>Loại câu cố định sau khi lưu.</FieldDescription>}
            </Field>

            <Field data-invalid={!!errors.stem}>
              <FieldLabel>Đề bài</FieldLabel>
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
                  <Plus data-icon="inline-start" /> Thêm đáp án ({fields.length}/{L.maxOptions})
                </Button>
              </div>
            </Field>

            {lectures && (
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
                <FieldDescription>Học viên thấy liên kết tới bài giảng này khi xem lại câu hỏi.</FieldDescription>
              </Field>
            )}
          </fieldset>
        </CardContent>
      </Card>

      {!locked && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-card p-2.5 shadow-lg">
          <span className="mr-auto flex items-center gap-2 pl-1.5 text-sm text-muted-foreground">
            {(isDirty || dirty) && <span className="size-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />}
            {isDirty || dirty ? 'Có thay đổi chưa lưu' : question ? 'Chưa có thay đổi' : 'Câu mới, chưa lưu'}
            {advanceLabel && <span className="hidden lg:inline">· Ctrl + Enter: {advanceLabel.toLowerCase()}</span>}
          </span>
          {isDirty && question && (
            <Button type="button" variant="ghost" className="max-sm:h-11" disabled={isSubmitting} onClick={() => reset()}>
              Huỷ thay đổi
            </Button>
          )}
          <Button
            type="submit"
            variant={advanceLabel ? 'outline' : 'default'}
            className="max-sm:h-11"
            disabled={isSubmitting || !pending}
          >
            {isSubmitting ? 'Đang lưu…' : 'Lưu'}
          </Button>
          {advanceLabel && (
            <Button type="button" className="max-sm:h-11" disabled={isSubmitting} onClick={advance}>
              {advanceLabel}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
