import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FileText, Search, SearchX } from 'lucide-react';
import { BlogAside } from '@/components/post/blog-aside';
import { FeedPost, topicTag } from '@/components/post/feed-post';
import { LinkPagination } from '@/components/shared/link-pagination';
import { EmptyState } from '@/components/shared/product-ui';
import { BlogSkeleton } from '@/components/skeletons/blog-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPostHighlights, listPosts, listPostTopics } from '@/lib/api/posts';
import { cn } from '@/lib/utils';
import type { PostSort } from '@/types/post';

export const metadata: Metadata = {
  title: 'Blog | Aolumi',
  description: 'Bài viết về lập trình, dữ liệu và công nghệ từ giảng viên Aolumi.',
  alternates: { canonical: '/blog' },
};

const LIMIT = 12;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const TABS: { value: PostSort; label: string }[] = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'popular', label: 'Nổi bật' },
];

// searchParams là runtime data: đọc bên trong Suspense để đổi bộ lọc không bị chặn.
export default function BlogPage(props: PageProps<'/blog'>) {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

// Bố cục bảng tin (sếp chốt 2026-11-24, tham khảo gendemyedu.com/social): cột luồng bài + cột phải (nổi bật, tác giả).
// Không dùng thẻ: mỗi bài là một mục trong luồng, ngăn bằng đường kẻ.
async function Body({ searchParams }: PageProps<'/blog'>) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const topic = one(sp.topic);
  const sort: PostSort = one(sp.sort) === 'popular' ? 'popular' : 'latest';
  const page = Math.max(1, Math.floor(Number(one(sp.page))) || 1);
  const [list, topics, highlights] = await Promise.all([
    listPosts({ q, topic, sort, page, limit: LIMIT }),
    listPostTopics(),
    getPostHighlights(),
  ]);

  const href = (next: { q?: string | null; topic?: string | null; sort?: PostSort; page?: number }) => {
    const p = new URLSearchParams();
    const nq = next.q === undefined ? q : next.q;
    const t = next.topic === undefined ? topic : next.topic;
    const s = next.sort ?? sort;
    if (nq) p.set('q', nq);
    if (t) p.set('topic', t);
    if (s !== 'latest') p.set('sort', s);
    if (next.page && next.page > 1) p.set('page', String(next.page));
    const str = p.toString();
    return str ? `/blog?${str}` : '/blog';
  };

  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  // API trả tối đa 12 chủ đề nhiều bài nhất. Chủ đề đang lọc nằm ngoài nhóm đó → vẫn hiện để người xem biết đang lọc gì.
  const tags = list?.topic && !topics.some((t) => t.slug === list.topic!.slug) ? [list.topic, ...topics] : topics;
  const filtered = !!q || !!topic;

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 pt-8 pb-20 lg:grid-cols-[minmax(0,42rem)_17rem] lg:justify-between">
      <section aria-labelledby="blog-title" className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <h1 id="blog-title" className="shrink-0 text-2xl font-extrabold tracking-tight text-foreground">
            Blog
          </h1>
          <form action="/blog" role="search" className="flex flex-1 gap-2">
            {topic && <input type="hidden" name="topic" value={topic} />}
            {sort !== 'latest' && <input type="hidden" name="sort" value={sort} />}
            <Input name="q" defaultValue={q} placeholder="Tìm theo tiêu đề bài viết" aria-label="Tìm bài viết theo tiêu đề" maxLength={100} />
            <Button type="submit" variant="outline" size="icon" aria-label="Tìm">
              <Search />
            </Button>
          </form>
        </div>

        {tags.length > 0 && (
          <nav aria-label="Lọc theo chủ đề" className="mt-5">
            {/* Màn rộng: xuống dòng (tối đa 12 chủ đề, không mục nào bị khuất). Màn hẹp: một dòng cuộn ngang, mép phải mờ dần
                báo còn chủ đề phía sau. */}
            <ul className="-mx-1 flex gap-1 px-1 pb-1 *:shrink-0 sm:flex-wrap max-sm:overflow-x-auto max-sm:[mask-image:linear-gradient(to_right,black_85%,transparent)] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
              {tags.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={href({ topic: topic === t.slug ? null : t.slug, page: 1 })}
                    aria-current={topic === t.slug ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-8 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                      topic === t.slug ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {topicTag(t.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label="Sắp xếp bài viết" className="mt-4 flex gap-6 border-b">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={href({ sort: t.value, page: 1 })}
              aria-current={sort === t.value ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 pb-2.5 text-sm font-semibold outline-none transition-colors focus-visible:text-foreground',
                sort === t.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {filtered && (
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground tabular-nums">{total}</span> bài
            {q && <> cho “{q}”</>}
            {list?.topic && <> về <span className="font-medium text-foreground">{topicTag(list.topic.name)}</span></>}
            <span aria-hidden> · </span>
            <Link href={href({ q: null, topic: null, page: 1 })} className="font-medium text-primary underline-offset-4 hover:underline">
              Bỏ lọc
            </Link>
          </p>
        )}

        {items.length === 0 ? (
          <div className="mt-8">
            {filtered ? (
              <EmptyState icon={SearchX} title="Không có bài viết phù hợp" description="Thử từ khoá khác hoặc chọn chủ đề khác." />
            ) : (
              <EmptyState icon={FileText} title="Chưa có bài viết nào" description="Bài viết của giảng viên sẽ xuất hiện ở đây." />
            )}
          </div>
        ) : (
          <ol className="divide-y">
            {items.map((p) => (
              <li key={p.id}>
                <FeedPost post={p} />
              </li>
            ))}
          </ol>
        )}
        {pages > 1 && (
          <div className="mt-6">
            <LinkPagination page={page} pages={pages} href={(n) => href({ page: n })} />
          </div>
        )}
      </section>

      {highlights && (highlights.popular.length > 0 || highlights.authors.length > 0) && (
        <aside aria-label="Nổi bật trên Blog" className="lg:sticky lg:top-24 lg:self-start lg:pt-1">
          <BlogAside data={highlights} />
        </aside>
      )}
    </div>
  );
}
