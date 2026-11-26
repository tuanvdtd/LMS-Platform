'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Eye, Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { CoverSlot, Panel, PublishChecklist, RelatedCourseSelect, TopicPicker, type CheckItem, type Topic } from '@/components/post-editor/post-fields';
import { PostEditor } from '@/components/post-editor/post-editor';
import { useAutosave, type SaveState } from '@/components/post-editor/use-autosave';
import { EmptyState } from '@/components/shared/product-ui';
import { PostEditorSkeleton } from '@/components/skeletons/my-posts-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { getMyPost, publishPost, updatePost } from '@/lib/api/my-posts';
import { cn } from '@/lib/utils';
import type { MyPost, SavePostPayload } from '@/types/post';
import { PostPreview } from './post-preview';

const SAVE_LABEL: Record<SaveState, string> = { idle: '', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Chưa lưu được' };
const EXCERPT_MAX = 300;

// Cùng điều kiện với BE (post-rules.ts publishProblems): có chữ, hoặc có ít nhất một ảnh.
const hasBody = (html: string) => /<img\s/i.test(html) || html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim() !== '';

function errorsOf(err: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return null;
  const list = (err.response.data as { errors?: { path: string[]; message: string }[] }).errors ?? [];
  return Object.fromEntries(list.map((e) => [e.path[0], e.message]));
}

// Trang soạn: khung soạn bên trái (tiêu đề + thanh công cụ + nội dung),
// cột thẻ bên phải (Xuất bản, Ảnh bìa, Tóm tắt, Chủ đề, Khoá học liên quan).
function Editor({ initial }: { initial: MyPost }) {
  const [status, setStatus] = useState(initial.status);
  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? '');
  const [topics, setTopics] = useState<Topic[]>(initial.topics);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [bodyHtml, setBodyHtml] = useState(initial.bodyHtml);
  const [relatedCourseId, setRelatedCourseId] = useState(initial.relatedCourseId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const payload: SavePostPayload = useMemo(
    () => ({ title, bodyHtml, excerpt: excerpt.trim() || null, coverUrl, topicIds: topics.map((t) => t.id), relatedCourseId }),
    [title, bodyHtml, excerpt, coverUrl, topics, relatedCourseId],
  );

  // Bài đang công khai không tự lưu: sửa xong bấm "Cập nhật" mới lên Blog.
  const { state, dirty, markSaved } = useAutosave(payload, (p) => updatePost(initial.id, p).then(() => undefined), status !== 'published');

  const checklist: CheckItem[] = [
    { label: 'Tiêu đề', done: !!title.trim() },
    { label: 'Nội dung', done: hasBody(bodyHtml) },
    { label: 'Chủ đề (1–3)', done: topics.length >= 1 },
    { label: 'Ảnh bìa', done: !!coverUrl },
    { label: 'Tóm tắt', done: !!excerpt.trim(), optional: true },
  ];

  const clear = (key: string) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));

  function showErrors(found: Record<string, string>) {
    setErrors(found);
    setPreview(false);
    if (found.title) return titleRef.current?.focus();
    const first = ['excerpt', 'topicIds', 'coverUrl', 'bodyHtml', 'relatedCourseId'].find((k) => found[k]);
    if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function save() {
    await updatePost(initial.id, payload);
    markSaved();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setErrors({});
    } catch (err) {
      const found = errorsOf(err);
      if (found) showErrors(found);
      else toast.error(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const publish = () =>
    run(async () => {
      if (dirty) await save();
      const p = await publishPost(initial.id);
      setStatus(p.status);
      setSlug(p.slug);
      toast.success('Đã xuất bản', {
        description: 'Bài hiện trên Blog sau tối đa 1 phút.',
        action: { label: 'Xem bài', onClick: () => window.open(`/blog/${p.slug}`, '_blank', 'noopener') },
      });
    });

  const update = () =>
    run(async () => {
      await save();
      toast.success('Đã cập nhật bài viết', { description: 'Blog hiện bản mới sau tối đa 1 phút.' });
    });

  const saveLabel = status === 'published' ? (dirty ? 'Có thay đổi chưa cập nhật' : 'Đang công khai') : SAVE_LABEL[state];

  return (
    <main className="min-h-[calc(100dvh-4rem)] pb-24">
      {/* Thanh trên: tên bài đang soạn (h1 của trang), trạng thái lưu, xem trước, hành động chính. */}
      <div className="sticky top-16 z-20 border-b bg-background">
        <div className="mx-auto flex h-13 max-w-[78rem] items-center gap-3 px-4">
          <Link
            href="/posts"
            aria-label="Về bài viết của tôi"
            title="Bài viết của tôi"
            className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className={cn('truncate text-sm font-semibold', title.trim() ? 'text-foreground' : 'text-muted-foreground')}>
              {title.trim() || 'Bài chưa có tiêu đề'}
            </h1>
            <p
              aria-live="polite"
              className={cn('hidden shrink-0 text-xs text-muted-foreground sm:block', state === 'error' && status !== 'published' && 'text-danger')}
            >
              {saveLabel}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
              {preview ? <PenLine data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
              {preview ? 'Soạn tiếp' : 'Xem trước'}
            </Button>
            {status === 'draft' && (
              <Button size="sm" disabled={busy} onClick={() => void publish()}>
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Xuất bản
              </Button>
            )}
            {status === 'published' && (
              <Button size="sm" disabled={busy || !dirty} onClick={() => void update()}>
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Cập nhật
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Xem trước: ẩn khu soạn (vẫn mount để giữ lịch sử hoàn tác) và dựng đúng trang đọc. */}
      {preview && (
        <PostPreview
          input={{
            id: initial.id,
            slug,
            title,
            excerpt,
            coverUrl,
            bodyHtml,
            topics,
            relatedCourseId,
            publishedAt: initial.publishedAt,
            updatedAt: initial.updatedAt,
          }}
        />
      )}
      <div className={cn('mx-auto grid max-w-[78rem] items-start gap-6 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]', preview && 'hidden')}>
        <div className="flex min-w-0 flex-col gap-4">
          {status === 'removed' && (
            <Alert variant="destructive">
              <AlertTitle>Bài đã bị quản trị viên gỡ</AlertTitle>
              <AlertDescription>
                {initial.removedReason ? `Lý do: ${initial.removedReason}. ` : ''}Bạn vẫn sửa được nội dung nhưng không tự xuất bản lại.
              </AlertDescription>
            </Alert>
          )}

          {/* Khung soạn: tiêu đề, thanh công cụ, nội dung chung một khung. */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="mx-auto max-w-[calc(68ch+4rem)] px-6 pt-6 pb-4 sm:px-8">
              <textarea
                ref={titleRef}
                value={title}
                maxLength={150}
                rows={1}
                placeholder="Tiêu đề bài viết"
                aria-label="Tiêu đề"
                aria-invalid={!!errors.title || undefined}
                aria-describedby={errors.title ? 'title-error' : undefined}
                onChange={(e) => {
                  setTitle(e.target.value.replace(/\n/g, ' '));
                  clear('title');
                }}
                onKeyDown={(e) => {
                  // Enter ở tiêu đề → nhảy xuống nội dung thay vì xuống dòng.
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.querySelector<HTMLElement>('.post-editing')?.focus();
                  }
                }}
                className="field-sizing-content w-full resize-none bg-transparent text-2xl leading-tight font-extrabold tracking-tight text-balance text-foreground outline-none placeholder:text-muted-foreground/60 md:text-3xl"
              />
              {errors.title && (
                <p id="title-error" className="mt-1 text-sm text-destructive">
                  {errors.title}
                </p>
              )}
            </div>

            <div id="field-bodyHtml" className="scroll-mt-32">
              {errors.bodyHtml && <p className="px-6 pb-3 text-sm text-destructive sm:px-8">{errors.bodyHtml}</p>}
              <PostEditor
                value={initial.bodyHtml}
                invalid={!!errors.bodyHtml}
                onChange={(html) => {
                  setBodyHtml(html);
                  clear('bodyHtml');
                }}
              />
            </div>

          </div>
        </div>

        <aside aria-label="Thông tin bài" className="flex flex-col gap-4">
          <PublishChecklist items={checklist} />
          {status === 'published' && slug && (
            <p className="-mt-1 px-1 text-sm text-muted-foreground">
              Đang công khai tại{' '}
              <a href={`/blog/${slug}`} target="_blank" rel="noopener" className="font-medium break-all text-primary underline-offset-4 hover:underline">
                /blog/{slug}
              </a>
            </p>
          )}

          <Panel id="field-coverUrl" title="Ảnh bìa">
            <CoverSlot
              value={coverUrl}
              error={errors.coverUrl}
              onChange={(url) => {
                setCoverUrl(url);
                clear('coverUrl');
              }}
            />
          </Panel>

          <Panel
            id="field-excerpt"
            title="Tóm tắt"
            aside={
              <span className="text-xs text-muted-foreground tabular-nums">
                {excerpt.length}/{EXCERPT_MAX}
              </span>
            }
          >
            <Textarea
              value={excerpt}
              maxLength={EXCERPT_MAX}
              rows={3}
              placeholder="Bỏ trống thì lấy đoạn đầu bài"
              aria-label="Tóm tắt"
              aria-invalid={!!errors.excerpt || undefined}
              onChange={(e) => {
                setExcerpt(e.target.value);
                clear('excerpt');
              }}
            />
            <p className={cn('mt-2 text-xs', errors.excerpt ? 'text-destructive' : 'text-muted-foreground')}>
              {errors.excerpt ?? 'Hiện trên thẻ bài và khi chia sẻ link.'}
            </p>
          </Panel>

          <Panel id="field-topicIds" title="Chủ đề" aside={<span className="text-xs text-muted-foreground tabular-nums">{topics.length}/3</span>}>
            <TopicPicker
              value={topics}
              error={errors.topicIds}
              onChange={(t) => {
                setTopics(t);
                clear('topicIds');
              }}
            />
          </Panel>

          <RelatedCourseSelect
            value={relatedCourseId}
            error={errors.relatedCourseId}
            onChange={(v) => {
              setRelatedCourseId(v);
              clear('relatedCourseId');
            }}
          />
        </aside>
      </div>
    </main>
  );
}

// Tải bài rồi mới dựng trình soạn: state của trình soạn khởi tạo từ bài một lần.
export function EditPost({ id }: { id: string }) {
  const [post, setPost] = useState<MyPost | null>(null);
  const [error, setError] = useState<'notFound' | 'failed' | null>(null);

  useEffect(() => {
    let stale = false;
    getMyPost(id).then(
      (p) => !stale && setPost(p),
      (e) => !stale && setError(axios.isAxiosError(e) && e.response?.status === 404 ? 'notFound' : 'failed'),
    );
    return () => {
      stale = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-page max-w-xl flex-col justify-center px-4 py-16">
        <EmptyState
          icon={PenLine}
          title={error === 'notFound' ? 'Không tìm thấy bài viết' : 'Không tải được bài viết'}
          description={error === 'notFound' ? 'Bài không tồn tại hoặc không phải của bạn.' : 'Hãy tải lại trang.'}
          action={
            <Link href="/posts" className={buttonVariants({ variant: 'outline' })}>
              Về bài viết của tôi
            </Link>
          }
        />
      </main>
    );
  }
  if (!post) return <PostEditorSkeleton />;
  return <Editor initial={post} />;
}
