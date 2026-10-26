'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Controller, useWatch, type Control, type UseFormReturn } from 'react-hook-form';
import { CircleAlert } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STARTER_TEMPLATES } from '@/lib/code-templates';
import { cn } from '@/lib/utils';
import {
  type ExerciseDetail,
  type Language,
  LANGUAGE_IDS,
  LANGUAGES,
  MAX_CODE_BYTES,
  MAX_IO_BYTES,
  MAX_TESTS,
  CPU_LIMIT_MS,
  MEMORY_LIMIT_KB,
  type UpdateCodePayload,
  VERIFY_BUDGET_PCT,
} from '@/types/exercise';
import { TestList } from './test-list';

const CodeEditor = dynamic(() => import('@/components/code-editor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full" />,
});

const n = (v: number) => v.toLocaleString('vi-VN');
// BE đếm .length (UTF-16) nên FE cũng vậy.
const code = z.string().max(MAX_CODE_BYTES, `Tối đa ${n(MAX_CODE_BYTES)} ký tự`);
const io = z.string().max(MAX_IO_BYTES, `Tối đa ${n(MAX_IO_BYTES)} ký tự`);
const starter = z.object({ code, solutionCode: code });

export const codeSchema = z.object({
  languages: z.array(z.enum(LANGUAGE_IDS as [Language, ...Language[]])).min(1, 'Chọn ít nhất 1 ngôn ngữ'),
  starters: z.object({ javascript: starter, python: starter, cpp: starter }),
  tests: z
    .array(
      z.object({
        testId: z.string().optional(), // id test đã lưu; useFieldArray giữ riêng key `id` nên đổi tên
        input: io,
        expectedOutput: io,
        isPublic: z.boolean(),
        points: z.number({ error: 'Nhập số' }).int('Nhập số nguyên').min(1, 'Từ 1 đến 100').max(100, 'Từ 1 đến 100'),
      }),
    )
    .max(MAX_TESTS, `Tối đa ${MAX_TESTS} test`),
});
export type CodeValues = z.infer<typeof codeSchema>;

const EMPTY = { code: '', solutionCode: '' };

export function toCodeValues(ex: ExerciseDetail): CodeValues {
  const starterOf = (language: Language) => {
    const s = ex.starters.find((x) => x.language === language);
    if (s) return { code: s.code, solutionCode: s.solutionCode ?? '' };
    // Ngôn ngữ đã bật mà chưa có starter (bài mới): điền mẫu như lúc tick bật, tránh hỏi xác nhận oan khi bỏ tick.
    return ex.languages.includes(language) ? { code: STARTER_TEMPLATES[language], solutionCode: '' } : EMPTY;
  };
  return {
    languages: ex.languages,
    starters: { javascript: starterOf('javascript'), python: starterOf('python'), cpp: starterOf('cpp') },
    tests: ex.tests.map((t) => ({
      testId: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
      isPublic: t.isPublic,
      points: t.points,
    })),
  };
}

export const toCodePayload = (v: CodeValues): UpdateCodePayload => ({
  languages: v.languages,
  starters: v.languages.map((language) => {
    const s = v.starters[language];
    return { language, code: s.code, solutionCode: s.solutionCode.trim() ? s.solutionCode : null };
  }),
  tests: v.tests.map(({ testId, ...t }) => (testId ? { id: testId, ...t } : t)),
});

// Path lỗi 400 của BE → field trong form; null = không gắn được vào ô nào (hiện toast).
export function codeField(path: string[], languages: Language[]): string | null {
  const [head, index, key] = path;
  if (head === 'starters') return index && key ? `starters.${languages[Number(index)]}.${key}` : null;
  if (head === 'tests' && key === 'id') return null;
  return path.join('.') || null;
}

// Tab "Code & test" (PUT /code): lưu luôn gỡ xuất bản.
export function CodeTab({ form, locked }: { form: UseFormReturn<CodeValues>; locked: boolean }) {
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const languages = useWatch({ control, name: 'languages' });
  const [active, setActive] = useState<Language>(languages[0]);
  const [removing, setRemoving] = useState<Language | null>(null);
  const current = languages.includes(active) ? active : languages[0];

  const drop = (lang: Language) => {
    setValue('languages', languages.filter((l) => l !== lang), { shouldDirty: true });
    setValue(`starters.${lang}`, EMPTY, { shouldDirty: true });
  };
  const toggle = (lang: Language, on: boolean) => {
    if (on) {
      setValue(`starters.${lang}`, { code: STARTER_TEMPLATES[lang], solutionCode: '' }, { shouldDirty: true });
      setValue('languages', LANGUAGE_IDS.filter((l) => l === lang || languages.includes(l)), { shouldDirty: true });
      setActive(lang);
      return;
    }
    // Chưa sửa gì (vẫn là mẫu, chưa có lời giải) thì bỏ luôn, không hỏi.
    const s = getValues(`starters.${lang}`);
    if (s.code === STARTER_TEMPLATES[lang] && !s.solutionCode.trim()) drop(lang);
    else setRemoving(lang);
  };

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Ngôn ngữ</FieldLegend>
        <FieldDescription>Học viên chọn một trong các ngôn ngữ này để làm bài. Mỗi ngôn ngữ cần lời giải mẫu riêng.</FieldDescription>
        <div className="flex flex-wrap gap-x-6">
          {LANGUAGE_IDS.map((l) => {
            const checked = languages.includes(l);
            return (
              <label key={l} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={checked}
                  disabled={locked || (checked && languages.length === 1)}
                  onCheckedChange={(on) => toggle(l, on === true)}
                />
                {LANGUAGES[l]}
              </label>
            );
          })}
        </div>
        <FieldError errors={[{ message: errors.languages?.message }]} />
      </FieldSet>

      {current && (
        <Tabs value={current} onValueChange={(v) => setActive(v as Language)}>
          <TabsList className="w-full group-data-horizontal/tabs:h-11 sm:w-fit">
            {languages.map((l) => (
              <TabsTrigger key={l} value={l} className="px-4">
                {LANGUAGES[l]}
                {errors.starters?.[l] && (
                  <>
                    <CircleAlert className="text-destructive" aria-hidden />
                    <span className="sr-only">(có lỗi)</span>
                  </>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {languages.map((l) => (
            <TabsContent key={l} value={l} className="flex flex-col gap-5 pt-3">
              <CodeField
                control={control}
                name={`starters.${l}.code`}
                language={l}
                label="Code khởi đầu (học viên thấy)"
                description="Học viên bắt đầu từ đoạn code này. Nên có sẵn khung đọc input và in kết quả."
                readOnly={locked}
              />
              <CodeField
                control={control}
                name={`starters.${l}.solutionCode`}
                language={l}
                label="Lời giải mẫu (ẩn với học viên)"
                description="Dùng để kiểm tra bộ test trước khi xuất bản. Học viên chỉ thấy sau khi làm đúng bài."
                readOnly={locked}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
      <p className="-mt-2 text-xs text-muted-foreground">Trong ô code, nhấn Esc rồi Tab để rời khỏi ô.</p>

      <p className="text-sm text-muted-foreground">
        Giới hạn mỗi test: {LANGUAGE_IDS.map((l) => `${LANGUAGES[l]} ${n(CPU_LIMIT_MS[l] / 1000)} s`).join(' · ')} CPU ·{' '}
        {n(MEMORY_LIMIT_KB / 1024)} MB. Lời giải mẫu phải chạy ≤ {VERIFY_BUDGET_PCT}% thời gian.
      </p>

      <TestList form={form} locked={locked} />

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ ngôn ngữ {removing && LANGUAGES[removing]}?</AlertDialogTitle>
            <AlertDialogDescription>
              Code khởi đầu và lời giải mẫu {removing && LANGUAGES[removing]} sẽ bị xoá khỏi form. Thay đổi chỉ áp dụng khi bạn lưu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Giữ lại</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) drop(removing);
                setRemoving(null);
              }}
            >
              Bỏ ngôn ngữ
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldGroup>
  );
}

function CodeField({
  control,
  name,
  language,
  label,
  description,
  readOnly,
}: {
  control: Control<CodeValues>;
  name: `starters.${Language}.${'code' | 'solutionCode'}`;
  language: Language;
  label: string;
  description: string;
  readOnly: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldTitle>{label}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
          {/* field.onChange của react-hook-form ổn định → CodeMirror không cấu hình lại mỗi lần gõ. */}
          <CodeEditor
            language={language}
            value={field.value}
            onChange={field.onChange}
            readOnly={readOnly}
            ariaLabel={`${label} – ${LANGUAGES[language]}`}
            className={cn(fieldState.error && 'border-destructive')}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
