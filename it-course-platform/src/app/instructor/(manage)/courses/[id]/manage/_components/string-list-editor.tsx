'use client';

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GoalsListName, GoalsValues } from './goals-form';

export const MAX_ITEMS = 10;
export const MAX_ITEM_LENGTH = 160;

type Props = {
  name: GoalsListName;
  anchor: string;
  title: string;
  hint: string;
  placeholder: string;
  control: Control<GoalsValues>;
  register: UseFormRegister<GoalsValues>;
  errors: FieldErrors<GoalsValues>;
};

// Danh sách câu trả lời: ≤10 ô, ≤160 ký tự/ô, bộ đếm, xoá từng ô (luôn giữ ít nhất 1 ô).
export function StringListEditor({ name, anchor, title, hint, placeholder, control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const listError = errors[name];

  return (
    <section id={anchor} className="scroll-mt-20 space-y-3">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {fields.map((field, i) => {
        const error = listError?.[i]?.value?.message;
        return (
          <div key={field.id}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={placeholder}
                  maxLength={MAX_ITEM_LENGTH}
                  className="pr-12"
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
                aria-label={`Xoá ô ${i + 1}`}
                disabled={fields.length === 1}
                onClick={() => remove(i)}
              >
                <Trash2 />
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
      {listError?.message && <p className="text-xs text-destructive">{listError.message}</p>}
      <Button
        type="button"
        variant="ghost"
        className="text-primary"
        disabled={fields.length >= MAX_ITEMS}
        onClick={() => append({ value: '' })}
      >
        <Plus /> Thêm câu trả lời
      </Button>
    </section>
  );
}

function Remaining({ control, name, index }: { control: Control<GoalsValues>; name: GoalsListName; index: number }) {
  const value = useWatch({ control, name: `${name}.${index}.value` });
  return (
    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
      {MAX_ITEM_LENGTH - (value?.length ?? 0)}
    </span>
  );
}
