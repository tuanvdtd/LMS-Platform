'use client';

import Image from 'next/image';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateCourse } from '@/lib/api/instructor-courses';
import { cn } from '@/lib/utils';
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
import { applySaveError, PageHeader, SaveBar, submitToPromise } from './form-save';
import { ThumbnailUpload } from './thumbnail-upload';
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
  const [title, subtitle, description, level, track, primaryTopic] = useWatch({
    control,
    name: ['title', 'subtitle', 'description', 'level', 'track', 'primaryTopic'],
  });
  const words = countWords(description);

  async function onSubmit(values: Values): Promise<boolean> {
    const { primaryTopic, ...fields } = values;
    try {
      const updated = await updateCourse(course.id, { ...fields, primaryTopicId: primaryTopic?.id ?? null });
      setCourse(updated);
      reset(values);
      toast.success('Đã lưu');
      return true;
    } catch (err) {
      applySaveError(
        err,
        setError,
        () => setCourse({ ...course, status: 'in_review' }),
        (path) => (path[0] === 'primaryTopicId' ? 'primaryTopic' : path[0]),
      );
      return false;
    }
  }

  useDirtySync(isDirty, submitToPromise(handleSubmit, onSubmit), () => reset());

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <PageHeader
        title="Trang tổng quan"
        description="Trang tổng quan quyết định học viên có bấm vào khoá của bạn hay không. Điền đủ để khoá dễ được tìm thấy."
      />

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <FormField label="Tiêu đề khoá học" htmlFor="title" error={errors.title?.message} counter={`${TITLE_MAX - title.length}`}
                hint="Ngắn gọn, có từ khoá chính. Ví dụ: “NestJS từ cơ bản đến triển khai thực tế”.">
                <Input id="title" maxLength={TITLE_MAX} className="h-10" aria-invalid={!!errors.title} {...register('title')} />
              </FormField>

              <FormField label="Phụ đề" htmlFor="subtitle" error={errors.subtitle?.message} counter={`${SUBTITLE_MAX - subtitle.length}`}>
                <Input
                  id="subtitle"
                  maxLength={SUBTITLE_MAX}
                  placeholder="Một câu nói rõ học viên đạt được gì"
                  className="h-10"
                  aria-invalid={!!errors.subtitle}
                  {...register('subtitle')}
                />
              </FormField>

              <FormField
                label="Mô tả khoá học"
                htmlFor="description"
                error={errors.description?.message}
                counter={
                  <span className={cn('font-sans font-medium', words >= MIN_WORDS ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
                    {words}/{MIN_WORDS} từ
                  </span>
                }
              >
                <Textarea
                  id="description"
                  rows={8}
                  placeholder="Khoá học dạy gì, học xong làm được gì, phù hợp với ai…"
                  className="min-h-40"
                  aria-invalid={!!errors.description}
                  {...register('description')}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Ngôn ngữ" htmlFor="language">
                  <Controller
                    control={control}
                    name="language"
                    render={({ field }) => (
                      <EnumSelect id="language" labels={LANGUAGE_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn ngôn ngữ" />
                    )}
                  />
                </FormField>
                <FormField label="Cấp độ" htmlFor="level" error={errors.level?.message}>
                  <Controller
                    control={control}
                    name="level"
                    render={({ field }) => (
                      <EnumSelect id="level" labels={SKILL_LEVEL_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn cấp độ" />
                    )}
                  />
                </FormField>
                <FormField label="Track" htmlFor="track" error={errors.track?.message}>
                  <Controller
                    control={control}
                    name="track"
                    render={({ field }) => (
                      <EnumSelect id="track" labels={TRACK_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn track" />
                    )}
                  />
                </FormField>
              </div>

              <FormField anchor="category" label="Thể loại" htmlFor="category-l1" error={errors.categoryId?.message}>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <CategoryPicker categories={categories} value={field.value} onChange={field.onChange} invalid={!!errors.categoryId} />
                  )}
                />
              </FormField>

              <FormField
                anchor="topic"
                label="Chủ đề chính"
                htmlFor="topic-search"
                error={errors.primaryTopic?.message}
                hint="Kỹ năng cốt lõi khoá học dạy, ví dụ React hoặc Docker."
              >
                <Controller
                  control={control}
                  name="primaryTopic"
                  render={({ field }) => <TopicPicker value={field.value} onChange={field.onChange} invalid={!!errors.primaryTopic} />}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hình ảnh &amp; video</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ThumbnailUpload disabled={locked} />
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaPlaceholder icon={<Video />} />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold">
                    Video quảng cáo <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
                  </p>
                  <p className="text-[13px]/relaxed text-muted-foreground">
                    1–2 phút giới thiệu khoá. Học viên xem video này dễ đăng ký hơn.
                  </p>
                  <span className="text-xs text-muted-foreground">Tải video lên · sắp có (đợt 3)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </fieldset>

        <aside className="flex flex-col gap-2.5 lg:sticky lg:top-23">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Xem trước thẻ khoá học</p>
          <Card className="gap-0 overflow-hidden py-0">
            {course.thumbnailUrl ? (
              <Image src={course.thumbnailUrl} alt="" width={300} height={169} unoptimized className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground/50">
                <ImageIcon className="size-7" />
              </div>
            )}
            <div className="flex flex-col gap-1.5 p-3.5">
              <p className="text-[15px]/snug font-bold">{title.trim() || 'Tiêu đề khoá học'}</p>
              <p className="text-[13px]/snug text-muted-foreground">{subtitle.trim() || 'Phụ đề sẽ hiện ở đây'}</p>
              {(level || track || primaryTopic) && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {level && <Badge variant="secondary" className="rounded-md">{SKILL_LEVEL_LABEL[level]}</Badge>}
                  {track && <Badge variant="secondary" className="rounded-md">{TRACK_LABEL[track]}</Badge>}
                  {primaryTopic && <Badge variant="secondary" className="rounded-md">{primaryTopic.name}</Badge>}
                </div>
              )}
            </div>
          </Card>
          <p className="text-[12.5px]/normal text-muted-foreground">Cập nhật theo nội dung bạn đang nhập, kể cả khi chưa lưu.</p>
        </aside>
      </div>

      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} locked={locked} onDiscard={() => reset()} />
    </form>
  );
}

function MediaPlaceholder({ icon, caption }: { icon: React.ReactNode; caption?: string }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-muted text-[13px] text-muted-foreground">
      {icon}
      {caption}
    </div>
  );
}

function FormField({
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
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Field id={anchor} data-invalid={!!error || undefined} className="scroll-mt-20 rounded-lg transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        {counter && <span className="font-mono text-xs text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {hint && <FieldDescription>{hint}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
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
