'use client';

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { GoalsListName, GoalsValues } from './goals-form';

export const MAX_ITEMS = 10;
export const MAX_ITEM_LENGTH = 160;

type Props = {
  name: GoalsListName;
  anchor: string;
  title: string;
  hint: string;
  placeholder: string;
  min: number; // số câu trả lời checklist cần (chỉ để hiển thị, BE mới là nơi quyết định)
  control: Control<GoalsValues>;
  register: UseFormRegister<GoalsValues>;
  errors: FieldErrors<GoalsValues>;
};

// Danh sách câu trả lời: ≤10 ô, ≤160 ký tự/ô, bộ đếm, xoá từng ô (luôn giữ ít nhất 1 ô).
export function StringListEditor({ name, anchor, title, hint, placeholder, min, control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const values = useWatch({ control, name });
  const filled = values?.filter((r) => r.value.trim()).length ?? 0;
  const listError = errors[name];

  return (
    <Card id={anchor} className="scroll-mt-20 transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {fields.map((field, i) => {
          const error = listError?.[i]?.value?.message;
          return (
            <div key={field.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={placeholder}
                    maxLength={MAX_ITEM_LENGTH}
                    className="h-10 pr-14"
                    aria-label={`${title} – ô ${i + 1}`}
                    aria-invalid={!!error}
                    {...register(`${name}.${i}.value`)}
                  />
                  <Remaining control={control} name={name} index={i} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label={`Xoá ô ${i + 1}`}
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  <Trash2 />
                </Button>
              </div>
              {error && <FieldError>{error}</FieldError>}
            </div>
          );
        })}
        {listError?.message && <FieldError>{listError.message}</FieldError>}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          disabled={fields.length >= MAX_ITEMS}
          onClick={() => append({ value: '' })}
        >
          <Plus data-icon="inline-start" /> Thêm câu trả lời
        </Button>
        <span
          className={cn(
            'text-[12.5px] font-semibold',
            filled >= min ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
          )}
        >
          {filled >= min ? '✓ Đủ yêu cầu' : `Cần thêm ${min - filled}`}
        </span>
      </CardFooter>
    </Card>
  );
}

function Remaining({ control, name, index }: { control: Control<GoalsValues>; name: GoalsListName; index: number }) {
  const value = useWatch({ control, name: `${name}.${index}.value` });
  return (
    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-muted-foreground">
      {MAX_ITEM_LENGTH - (value?.length ?? 0)}
    </span>
  );
}
