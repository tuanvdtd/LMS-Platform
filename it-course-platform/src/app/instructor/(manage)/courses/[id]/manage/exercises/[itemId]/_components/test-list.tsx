'use client';

import { Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MAX_IO_BYTES, MAX_TESTS } from '@/types/exercise';
import type { CodeValues } from './code-tab';
import { IconButton } from './statement-tab';

// Mỗi test một card. Thứ tự trong danh sách = thứ tự chấm; test cũ giữ `testId` để BE cập nhật đúng test.
export function TestList({ form, locked }: { form: UseFormReturn<CodeValues>; locked: boolean }) {
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'tests' });
  const tests = useWatch({ control, name: 'tests' });
  const publicCount = tests.filter((t) => t.isPublic).length;
  const total = tests.reduce((sum, t) => sum + (Number.isFinite(t.points) ? t.points : 0), 0);
  const listError = errors.tests?.message ?? errors.tests?.root?.message;

  return (
    <FieldSet>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <FieldLegend variant="label">
          Test ({fields.length}/{MAX_TESTS})
        </FieldLegend>
        <span className="text-sm text-muted-foreground">
          {publicCount} công khai · tổng {total} điểm
        </span>
      </div>
      <FieldDescription>
        Học viên được điểm của các test chạy đúng. Cần ít nhất 1 test công khai để xuất bản.
      </FieldDescription>
      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Chưa có test nào. Thêm test với input và output mong đợi để chấm bài.
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const e = errors.tests?.[i];
          const testId = tests[i]?.testId;
          return (
            <li
              key={f.id}
              id={testId ? `test-${testId}` : undefined}
              className="flex scroll-mt-20 flex-col gap-3 rounded-lg border bg-background p-3 transition-shadow sm:p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Test {i + 1}</span>
                <div className="ml-auto flex">
                  <IconButton label={`Đưa test ${i + 1} lên`} disabled={i === 0} onClick={() => swap(i, i - 1)}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    label={`Đưa test ${i + 1} xuống`}
                    disabled={i === fields.length - 1}
                    onClick={() => swap(i, i + 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton label={`Xoá test ${i + 1}`} onClick={() => remove(i)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={!!e?.input}>
                  <FieldLabel htmlFor={`test-${i}-input`}>Input</FieldLabel>
                  <Textarea
                    id={`test-${i}-input`}
                    rows={4}
                    maxLength={MAX_IO_BYTES}
                    spellCheck={false}
                    className="font-mono text-sm"
                    aria-invalid={!!e?.input}
                    {...register(`tests.${i}.input`)}
                  />
                  <FieldError errors={[e?.input]} />
                </Field>
                <Field data-invalid={!!e?.expectedOutput}>
                  <FieldLabel htmlFor={`test-${i}-output`}>Output mong đợi</FieldLabel>
                  <Textarea
                    id={`test-${i}-output`}
                    rows={4}
                    maxLength={MAX_IO_BYTES}
                    spellCheck={false}
                    className="font-mono text-sm"
                    aria-invalid={!!e?.expectedOutput}
                    {...register(`tests.${i}.expectedOutput`)}
                  />
                  <FieldError errors={[e?.expectedOutput]} />
                </Field>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <Controller
                  control={control}
                  name={`tests.${i}.isPublic`}
                  render={({ field }) => (
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
                      <Checkbox checked={field.value} disabled={locked} onCheckedChange={(v) => field.onChange(v === true)} />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">Công khai</span>
                        <span className="text-xs text-muted-foreground">Học viên thấy và chạy thử được</span>
                      </span>
                    </label>
                  )}
                />
                <Field data-invalid={!!e?.points} orientation="horizontal" className="w-auto">
                  <FieldLabel htmlFor={`test-${i}-points`}>Điểm</FieldLabel>
                  <Input
                    id={`test-${i}-points`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    className="w-20 max-sm:h-11"
                    aria-invalid={!!e?.points}
                    {...register(`tests.${i}.points`, { valueAsNumber: true })}
                  />
                </Field>
              </div>
              <FieldError errors={[e?.points]} />
            </li>
          );
        })}
      </ol>
      <FieldError errors={listError ? [{ message: listError }] : []} />
      <div>
        <Button
          type="button"
          variant="outline"
          className="max-sm:h-11"
          disabled={fields.length >= MAX_TESTS}
          onClick={() => append({ input: '', expectedOutput: '', isPublic: fields.length === 0, points: 10 })}
        >
          <Plus data-icon="inline-start" /> Thêm test
        </Button>
      </div>
    </FieldSet>
  );
}
