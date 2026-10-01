'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { updateCourse } from '@/lib/api/instructor-courses';
import { useCourse, useDirtySync } from './course-provider';
import { applySaveError, PageHeader, SaveBar, submitToPromise } from './form-save';
import { MAX_ITEM_LENGTH, MAX_ITEMS, StringListEditor } from './string-list-editor';

// Giới hạn khớp BE (spec §4.3). Ô rỗng được phép trong form, bỏ đi khi gửi.
const row = z.object({ value: z.string().trim().max(MAX_ITEM_LENGTH, `Tối đa ${MAX_ITEM_LENGTH} ký tự`) });
const list = z.array(row).max(MAX_ITEMS, `Tối đa ${MAX_ITEMS} mục`);
const schema = z.object({ learningObjectives: list, requirements: list, targetAudience: list });

export type GoalsValues = z.infer<typeof schema>;
export type GoalsListName = keyof GoalsValues;

// useFieldArray cần object → { value }. Hiện đủ số ô mặc định (4 / 1 / 1).
const toRows = (items: string[], min: number) =>
  Array.from({ length: Math.max(items.length, min) }, (_, i) => ({ value: items[i] ?? '' }));
const toList = (rows: { value: string }[]) => rows.map((r) => r.value.trim()).filter(Boolean);

export function GoalsForm() {
  const { course, setCourse } = useCourse();
  const locked = course.status === 'in_review';
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GoalsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      learningObjectives: toRows(course.learningObjectives, 4),
      requirements: toRows(course.requirements, 1),
      targetAudience: toRows(course.targetAudience, 1),
    },
  });

  async function onSubmit(values: GoalsValues): Promise<boolean> {
    try {
      const updated = await updateCourse(course.id, {
        learningObjectives: toList(values.learningObjectives),
        requirements: toList(values.requirements),
        targetAudience: toList(values.targetAudience),
      });
      setCourse(updated);
      reset(values);
      toast.success('Đã lưu');
      return true;
    } catch (err) {
      applySaveError(
        err,
        setError,
        () => setCourse({ ...course, status: 'in_review' }),
        // ['learningObjectives', '2'] → 'learningObjectives.2.value' (index sau khi BE bỏ ô rỗng, gần đúng)
        (path) => (path.length > 1 ? `${path[0]}.${path[1]}.value` : path[0]),
      );
      return false;
    }
  }

  useDirtySync(isDirty, submitToPromise(handleSubmit, onSubmit), () => reset());

  const listProps = { control, register, errors };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <PageHeader
        title="Học viên mục tiêu"
        description="Những mô tả này hiển thị công khai trên trang khoá học và giúp học viên quyết định khoá có phù hợp với họ không."
      />
      <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
        <StringListEditor
          name="learningObjectives"
          anchor="objectives"
          title="Học viên sẽ học được gì trong khoá học của bạn?"
          hint="Nhập ít nhất 4 mục tiêu hoặc kết quả học tập mà học viên đạt được sau khi hoàn thành khoá học."
          placeholder="Ví dụ: Xây dựng ứng dụng React có định tuyến và gọi API"
          min={4}
          {...listProps}
        />
        <StringListEditor
          name="requirements"
          anchor="requirements"
          title="Yêu cầu hoặc điều kiện tiên quyết để tham gia khoá học là gì?"
          hint="Liệt kê kỹ năng, kinh nghiệm, công cụ hoặc thiết bị học viên cần có trước khi học. Nếu không có, hãy ghi rõ điều đó."
          placeholder="Ví dụ: Biết JavaScript cơ bản"
          min={1}
          {...listProps}
        />
        <StringListEditor
          name="targetAudience"
          anchor="audience"
          title="Khoá học này dành cho đối tượng nào?"
          hint="Mô tả rõ những học viên sẽ thấy nội dung khoá học có giá trị."
          placeholder="Ví dụ: Lập trình viên frontend mới bắt đầu với React"
          min={1}
          {...listProps}
        />
      </fieldset>
      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} locked={locked} onDiscard={() => reset()} />
    </form>
  );
}
