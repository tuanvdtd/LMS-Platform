import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FileText, Search, SearchX } from 'lucide-react';
import { PostCardView } from '@/components/post/post-card';
import { LinkPagination } from '@/components/shared/link-pagination';
import { EmptyState } from '@/components/shared/product-ui';
import { BlogSkeleton } from '@/components/skeletons/blog-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listPosts, listPostTopics } from '@/lib/api/posts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Blog | Aolumi',
  description: 'Bài viết về lập trình, dữ liệu và công nghệ từ giảng viên Aolumi.',
  alternates: { canonical: '/blog' },
};

const LIMIT = 12;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const chip = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50';

// searchParams là runtime data: đọc bên trong Suspense để đổi bộ lọc không bị chặn.
export default function BlogPage(props: PageProps<'/blog'>) {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ searchParams }: PageProps<'/blog'>) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const topic = one(sp.topic);
  const page = Math.max(1, Math.floor(Number(one(sp.page))) || 1);
  const [list, topics] = await Promise.all([listPosts({ q, topic, page, limit: LIMIT }), listPostTopics()]);

  const href = (next: { topic?: string | null; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    const t = next.topic === undefined ? topic : next.topic;
    if (t) p.set('topic', t);
    if (next.page && next.page > 1) p.set('page', String(next.page));
    const s = p.toString();
    return s ? `/blog?${s}` : '/blog';
  };

  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  // Bài mới nhất phóng to chỉ ở trang đầu khi không lọc: lúc đang tìm/lọc thì mọi kết quả ngang hàng.
  const featured = page === 1 && !q && !topic ? items[0] : undefined;
  const rest = featured ? items.slice(1) : items;
  // Chủ đề đang lọc nằm ngoài 12 chủ đề nhiều bài nhất → vẫn hiện chip của nó để người xem biết đang lọc gì.
  const chips = list?.topic && !topics.some((t) => t.slug === list.topic!.slug) ? [{ ...list.topic, count: total }, ...topics] : topics;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Blog</h1>
          <p className="max-w-xl text-muted-foreground">Bài viết về lập trình, dữ liệu và công nghệ từ giảng viên Aolumi.</p>
        </div>
        <form action="/blog" role="search" className="flex w-full gap-2 md:w-80">
          {topic && <input type="hidden" name="topic" value={topic} />}
          <Input name="q" defaultValue={q} placeholder="Tìm bài viết" aria-label="Tìm bài viết theo tiêu đề" maxLength={100} />
          <Button type="submit" variant="outline" size="icon" aria-label="Tìm">
            <Search />
          </Button>
        </form>
      </header>

      {chips.length > 0 && (
        <nav aria-label="Lọc theo chủ đề" className="-mx-4 mt-8 overflow-x-auto px-4">
          <ul className="flex gap-2 pb-1">
            <li>
              <Link
                href={href({ topic: null })}
                aria-current={!topic ? 'page' : undefined}
                className={cn(chip, !topic ? 'bg-primary-soft font-semibold text-primary' : 'bg-secondary text-secondary-foreground hover:bg-muted')}
              >
                Tất cả
              </Link>
            </li>
            {chips.map((t) => (
              <li key={t.slug}>
                <Link
                  href={href({ topic: t.slug })}
                  aria-current={topic === t.slug ? 'page' : undefined}
                  className={cn(
                    chip,
                    topic === t.slug ? 'bg-primary-soft font-semibold text-primary' : 'bg-secondary text-secondary-foreground hover:bg-muted',
                  )}
                >
                  {t.name}
                  <span className="text-xs tabular-nums opacity-70">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {q && (
        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{total}</span> kết quả cho “{q}”
          <span aria-hidden> · </span>
          <Link href={topic ? `/blog?topic=${topic}` : '/blog'} className="font-medium text-primary underline-offset-4 hover:underline">
            Xoá tìm kiếm
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {items.length === 0 ? (
          q || topic ? (
            <EmptyState
              icon={SearchX}
              title="Không có bài viết phù hợp"
              description="Thử từ khoá khác hoặc xem tất cả bài viết."
              action={
                <Link href="/blog" className={buttonVariants({ variant: 'outline' })}>
                  Xem tất cả bài viết
                </Link>
              }
            />
          ) : (
            <EmptyState icon={FileText} title="Chưa có bài viết nào" description="Bài viết của giảng viên sẽ xuất hiện ở đây." />
          )
        ) : (
          <>
            {featured && <PostCardView post={featured} featured />}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCardView key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
        {pages > 1 && <LinkPagination page={page} pages={pages} href={(n) => href({ page: n })} />}
      </div>
    </div>
  );
}
