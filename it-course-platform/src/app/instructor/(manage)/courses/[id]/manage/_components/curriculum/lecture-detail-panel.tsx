'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, FileText, Plus, RefreshCw, Trash2, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { getAssetUrl } from '@/lib/api/assets';
import { addResource, removeContent, removeResource, setContent, updateItem } from '@/lib/api/curriculum';
import {
  type CurriculumItem,
  type CurriculumResponse,
  formatBytes,
  type LibraryAsset,
  MAX_RESOURCES,
} from '@/types/curriculum';
import { useDirtySync } from '../course-provider';
import { submitToPromise } from '../form-save';
import { ContentPicker } from './content-picker';
import { useCurriculum } from './curriculum-context';

const schema = z.object({
  description: z.string().max(5000, 'Tối đa 5000 ký tự'),
  isPreview: z.boolean(),
  isDownloadable: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toValues = (item: CurriculumItem): Values => ({
  description: item.description ?? '',
  isPreview: item.isPreview,
  isDownloadable: item.isDownloadable,
});

// Mở tab trước khi await để trình duyệt không chặn popup, rồi trỏ tới URL ký (hạn 5 phút).
async function viewPdf(assetId: string) {
  const tab = window.open('', '_blank');
  try {
    const { url } = await getAssetUrl(assetId);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    }
  } catch {
    tab?.close();
    toast.error('Không mở được file');
  }
}

// Chi tiết bài giảng (spec §5.1): nội dung PDF + tài nguyên ghi ngay; mô tả / xem thử / cho tải có nút Lưu riêng (C3).
export function LectureDetailPanel({ item }: { item: CurriculumItem }) {
  const { courseId, locked, run, confirm } = useCurriculum();
  const [picker, setPicker] = useState<'content' | 'resource' | null>(null);
  const [abortUpload, setAbortUpload] = useState<(() => void) | null>(null);
  const uploading = abortUpload !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(item) });

  async function onSubmit(values: Values): Promise<boolean> {
    if (uploading) {
      toast.info('Đang tải file lên, chờ xong rồi lưu');
      return false;
    }
    const ok = await run(() =>
      updateItem(courseId, item.id, { ...values, description: values.description.trim() || null }),
    );
    if (ok) {
      reset(values);
      toast.success('Đã lưu');
    }
    return ok;
  }

  // Dirty khi form chưa lưu HOẶC đang upload (spec §5.2); "Bỏ thay đổi" = reset + huỷ upload.
  useDirtySync(isDirty || uploading, submitToPromise(handleSubmit, onSubmit), () => {
    abortUpload?.();
    reset();
  });

  const onUploadingChange = (abort: (() => void) | null) => setAbortUpload(() => abort);
  const pickWith = (call: (assetId: string) => Promise<CurriculumResponse>) => async (asset: LibraryAsset) => {
    const ok = await run(() => call(asset.id));
    if (ok) setPicker(null);
    return ok;
  };
  const doc = item.document;
  // Đang tải thì không cho mở/đổi ô chọn: đổi ô sẽ unmount picker → huỷ upload ngầm.
  const noPick = locked || uploading;

  // "Xem" PDF nằm ngoài fieldset khoá: chờ duyệt vẫn xem được, chỉ khoá phần sửa.
  return (
    <div className="flex min-w-0 flex-col gap-5 border-t px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Nội dung</p>
        {doc ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{doc.fileName}</span>
            <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void viewPdf(doc.id)}>
              <Eye data-icon="inline-start" />
              Xem
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={noPick} onClick={() => setPicker('content')}>
              <RefreshCw data-icon="inline-start" />
              Thay
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={noPick}
              onClick={() =>
                confirm('Gỡ PDF khỏi bài giảng? Bài giảng sẽ thành chưa xuất bản; file vẫn còn trong thư viện.', () =>
                  void run(() => removeContent(courseId, item.id)),
                )
              }
            >
              <X data-icon="inline-start" />
              Gỡ
            </Button>
          </div>
        ) : (
          picker !== 'content' && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={noPick} onClick={() => setPicker('content')}>
                <FileText data-icon="inline-start" />
                Tài liệu PDF
              </Button>
              <Button type="button" variant="outline" size="sm" disabled title="Sắp có (đợt 3)">
                <Video data-icon="inline-start" />
                Video · đợt 3
              </Button>
            </div>
          )
        )}
        {picker === 'content' && (
          <ContentPicker
            onPick={pickWith((assetId) => setContent(courseId, item.id, assetId))}
            onClose={() => setPicker(null)}
            onUploadingChange={onUploadingChange}
          />
        )}
      </div>

      <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <Field data-invalid={!!errors.description || undefined}>
            <FieldLabel htmlFor={`desc-${item.id}`}>Mô tả bài giảng</FieldLabel>
            <Textarea
              id={`desc-${item.id}`}
              rows={3}
              placeholder="Học viên sẽ học được gì trong bài này?"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" {...register('isPreview')} />
            Cho xem thử (không cần mua khoá)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" {...register('isDownloadable')} />
            Cho tải xuống file PDF
          </label>
          <div>
            <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">
            Tài nguyên đính kèm{' '}
            <span className="font-normal text-muted-foreground">
              ({item.resources.length}/{MAX_RESOURCES})
            </span>
          </p>
          {item.resources.length > 0 && (
            <ul className="flex flex-col gap-1">
              {item.resources.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(r.asset.sizeBytes)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá tài nguyên ${r.title}`}
                    onClick={() => void run(() => removeResource(courseId, r.id))}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {picker === 'resource' ? (
            <ContentPicker
              onPick={pickWith((assetId) => addResource(courseId, item.id, assetId))}
              onClose={() => setPicker(null)}
              onUploadingChange={onUploadingChange}
            />
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={noPick || item.resources.length >= MAX_RESOURCES}
                onClick={() => setPicker('resource')}
              >
                <Plus data-icon="inline-start" />
                Tài nguyên
              </Button>
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}
