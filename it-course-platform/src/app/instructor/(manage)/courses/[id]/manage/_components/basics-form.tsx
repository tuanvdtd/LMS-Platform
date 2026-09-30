'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateCourse } from '@/lib/api/instructor-courses';
import type { CategoryNode } from '@/types';
import {
  type CourseDetail,
  type CourseLanguage,
  LANGUAGE_LABEL,
  type Ref,
  SKILL_LEVEL_LABEL,
  type SkillLevel,
  type Track,
  TRACK_LABEL,
} from '@/types/instructor-course';
import { CategoryPicker } from './category-picker';
import { useCourse, useDirtySync } from './course-provider';
import { applySaveError, SaveButton } from './form-save';
import { TopicPicker } from './topic-picker';

const TITLE_MAX = 60;
const SUBTITLE_MAX = 120;
const MIN_WORDS = 200; // gợi ý, khớp MIN_DESCRIPTION_WORDS ở BE
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Giới hạn khớp BE (spec §4.3). Select chỉ cho chọn giá trị hợp lệ nên enum không kiểm lại.
const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề khoá học').max(TITLE_MAX, `Tối đa ${TITLE_MAX} ký tự`),
  subtitle: z.string().trim().max(SUBTITLE_MAX, `Tối đa ${SUBTITLE_MAX} ký tự`),
  description: z.string().refine((s) => countWords(s) <= 5000, 'Tối đa 5000 từ'),
  language: z.custom<CourseLanguage>(),
  level: z.custom<SkillLevel | null>(),
  track: z.custom<Track | null>(),
  categoryId: z.string().nullable(),
  primaryTopic: z.custom<Ref | null>(),
});
type Values = z.infer<typeof schema>;

const toValues = (c: CourseDetail): Values => ({
  title: c.title,
  subtitle: c.subtitle ?? '',
  description: c.description ?? '',
  language: c.language,
  level: c.level,
  track: c.track,
  categoryId: c.category?.id ?? null,
  primaryTopic: c.primaryTopic,
});

export function BasicsForm({ categories }: { categories: CategoryNode[] }) {
  const { course, setCourse } = useCourse();
  const locked = course.status === 'in_review';
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(course) });
  const [title, subtitle, description] = useWatch({ control, name: ['title', 'subtitle', 'description'] });
  const words = countWords(description);

  useDirtySync(isDirty);

  async function onSubmit(values: Values) {
    const { primaryTopic, ...fields } = values;
    try {
      const updated = await updateCourse(course.id, { ...fields, primaryTopicId: primaryTopic?.id ?? null });
      setCourse(updated);
      reset(values);
      toast.success('Đã lưu');
    } catch (err) {
      applySaveError(
        err,
        setError,
        () => setCourse({ ...course, status: 'in_review' }),
        (path) => (path[0] === 'primaryTopicId' ? 'primaryTopic' : path[0]),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-2xl font-extrabold">Trang tổng quan khoá học</h1>
        <SaveButton isDirty={isDirty} isSubmitting={isSubmitting} locked={locked} />
      </div>

      <fieldset disabled={locked} className="space-y-6">
        <Field label="Tiêu đề khoá học" htmlFor="title" error={errors.title?.message} counter={`${title.length}/${TITLE_MAX}`}>
          <Input id="title" maxLength={TITLE_MAX} className="scroll-mt-20" aria-invalid={!!errors.title} {...register('title')} />
        </Field>

        <Field
          label="Phụ đề khoá học"
          htmlFor="subtitle"
          error={errors.subtitle?.message}
          counter={`${subtitle.length}/${SUBTITLE_MAX}`}
        >
          <Input
            id="subtitle"
            maxLength={SUBTITLE_MAX}
            placeholder="Một câu tóm tắt học viên sẽ đạt được gì"
            className="scroll-mt-20"
            aria-invalid={!!errors.subtitle}
            {...register('subtitle')}
          />
        </Field>

        <Field
          label="Mô tả khoá học"
          htmlFor="description"
          error={errors.description?.message}
          hint={`${words} từ${words < MIN_WORDS ? ` · nên có ít nhất ${MIN_WORDS} từ` : ''}`}
        >
          <Textarea
            id="description"
            rows={10}
            className="min-h-40 scroll-mt-20"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ngôn ngữ" htmlFor="language">
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <EnumSelect id="language" labels={LANGUAGE_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn ngôn ngữ" />
              )}
            />
          </Field>
          <Field label="Cấp độ" htmlFor="level" error={errors.level?.message}>
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <EnumSelect id="level" labels={SKILL_LEVEL_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn cấp độ" />
              )}
            />
          </Field>
          <Field label="Track nghề nghiệp" htmlFor="track" error={errors.track?.message}>
            <Controller
              control={control}
              name="track"
              render={({ field }) => (
                <EnumSelect id="track" labels={TRACK_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn track" />
              )}
            />
          </Field>
        </div>

        <Field anchor="category" label="Thể loại" htmlFor="category-l1" error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <CategoryPicker categories={categories} value={field.value} onChange={field.onChange} invalid={!!errors.categoryId} />
            )}
          />
        </Field>

        <Field
          anchor="topic"
          label="Khoá học của bạn chủ yếu dạy gì?"
          htmlFor="topic-search"
          error={errors.primaryTopic?.message}
          hint="Chọn một chủ đề chính, ví dụ React hoặc Docker."
        >
          <Controller
            control={control}
            name="primaryTopic"
            render={({ field }) => <TopicPicker value={field.value} onChange={field.onChange} invalid={!!errors.primaryTopic} />}
          />
        </Field>

        <div id="thumbnail" className="grid scroll-mt-20 gap-4 sm:grid-cols-2">
          {['Ảnh bìa khoá học', 'Video quảng cáo'].map((label) => (
            <div key={label} className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">Sắp có (đợt 2)</p>
            </div>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  anchor,
  error,
  hint,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  anchor?: string; // id để checklist cuộn tới, khi control không có id trùng anchor
  error?: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={anchor} className="scroll-mt-20 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {counter && <span className="text-xs text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function EnumSelect<T extends string>({
  id,
  labels,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  labels: Record<T, string>;
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
}) {
  return (
    <Select items={labels} value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger id={id} className="w-full scroll-mt-20">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(Object.keys(labels) as T[]).map((key) => (
            <SelectItem key={key} value={key}>
              {labels[key]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
