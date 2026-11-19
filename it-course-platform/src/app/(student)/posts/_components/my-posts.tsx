'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, FileText, Loader2, PenLine, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EngagementCounts } from '@/components/post/post-card';
import { EmptyState } from '@/components/shared/product-ui';
import { MyPostsSkeleton } from '@/components/skeletons/my-posts-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiMessage } from '@/lib/api/checkout';
import { createPost, deletePost, getPostPermission, listMyPosts, unpublishPost } from '@/lib/api/my-posts';
import { fullTime, timeAgo } from '@/lib/time-ago';
import type { MyPostRow } from '@/types/post';

type Data = { canWrite: boolean; posts: MyPostRow[] };

function Row({ post, onChange, onDelete }: { post: MyPostRow; onChange: (p: MyPostRow) => void; onDelete: (p: MyPostRow) => void }) {
  const [busy, setBusy] = useState(false);

  async function unpublish() {
    setBusy(true);
    try {
      const p = await unpublishPost(post.id);
      onChange(p);
      toast.success('Đã gỡ bài về nháp', { description: 'Bài biến khỏi Blog sau tối đa 1 phút.' });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/posts/${post.id}/edit`}
            className="min-w-0 rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {post.title || <span className="text-muted-foreground">Chưa có tiêu đề</span>}
          </Link>
          {post.status === 'removed' && <Badge variant="destructive">Bị gỡ</Badge>}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>
            {post.status === 'published' && post.publishedAt ? 'Xuất bản' : 'Sửa lần cuối'}{' '}
            <time dateTime={post.updatedAt} title={fullTime(post.updatedAt)}>
              {timeAgo(post.status === 'published' && post.publishedAt ? post.publishedAt : post.updatedAt).toLowerCase()}
            </time>
          </span>
          {post.status === 'published' && (post.likeCount > 0 || post.commentCount > 0) && (
            <>
              <span aria-hidden>·</span>
              <EngagementCounts likeCount={post.likeCount} commentCount={post.commentCount} />
            </>
          )}
        </p>
        {post.status === 'removed' && post.removedReason && (
          <p className="text-sm text-destructive">Lý do: {post.removedReason}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Link href={`/posts/${post.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <PenLine data-icon="inline-start" />
          Sửa
        </Link>
        {post.status === 'published' && post.slug && (
          <>
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <ExternalLink data-icon="inline-start" />
              Xem
            </a>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void unpublish()}>
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Gỡ về nháp
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(post)}>
          Xoá
        </Button>
      </div>
    </li>
  );
}

// Khu "Bài viết của tôi": danh sách nháp / đã xuất bản, tạo bài mới, gỡ, xoá.
export function MyPosts() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [target, setTarget] = useState<MyPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([getPostPermission(), listMyPosts()]).then(
      ([perm, posts]) => setData({ canWrite: perm.canWrite, posts }),
      () => setError(true),
    );
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không tải được danh sách bài viết</AlertTitle>
        <AlertDescription>Hãy tải lại trang.</AlertDescription>
      </Alert>
    );
  }
  if (!data) return <MyPostsSkeleton />;

  const drafts = data.posts.filter((p) => p.status !== 'published');
  const published = data.posts.filter((p) => p.status === 'published');
  const update = (p: MyPostRow) => setData((d) => d && { ...d, posts: d.posts.map((x) => (x.id === p.id ? { ...x, ...p } : x)) });

  async function create() {
    setCreating(true);
    try {
      const { id } = await createPost();
      router.push(`/posts/${id}/edit`);
    } catch (err) {
      toast.error(apiMessage(err));
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await deletePost(target.id);
      setData((d) => d && { ...d, posts: d.posts.filter((p) => p.id !== target.id) });
      toast.success('Đã xoá bài viết');
      setTarget(null);
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  const list = (posts: MyPostRow[], empty: string) =>
    posts.length ? (
      <ul className="divide-y rounded-xl border bg-card">
        {posts.map((p) => (
          <Row key={p.id} post={p} onChange={update} onDelete={setTarget} />
        ))}
      </ul>
    ) : (
      <EmptyState icon={FileText} title={empty} />
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Bài viết của tôi</h1>
        {data.canWrite && (
          <Button onClick={() => void create()} disabled={creating}>
            {creating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}
            Viết bài mới
          </Button>
        )}
      </div>

      {!data.canWrite && data.posts.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="Bạn chưa viết bài được"
          description="Bài viết hiện dành cho giảng viên đã có khoá học đang bán hoặc đã được duyệt hồ sơ giảng viên."
          action={
            <Link href="/instructor" className={buttonVariants({ variant: 'outline' })}>
              Tới khu giảng viên
            </Link>
          }
        />
      ) : (
        <Tabs defaultValue={drafts.length || !published.length ? 'drafts' : 'published'}>
          <TabsList>
            <TabsTrigger value="drafts">
              Nháp <span className="tabular-nums text-muted-foreground">{drafts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="published">
              Đã xuất bản <span className="tabular-nums text-muted-foreground">{published.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="drafts" className="pt-4">
            {list(drafts, 'Chưa có bài nháp nào.')}
          </TabsContent>
          <TabsContent value="published" className="pt-4">
            {list(published, 'Chưa có bài nào được xuất bản.')}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!target} onOpenChange={(o) => !o && !deleting && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bài viết này?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.title ? `“${target.title}” sẽ bị xoá vĩnh viễn.` : 'Bài sẽ bị xoá vĩnh viễn.'} Không khôi phục được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Xoá
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
