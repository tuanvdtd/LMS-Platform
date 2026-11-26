import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { renderPostHtml } from '@/lib/post-html';
import { cn } from '@/lib/utils';
import type { PostDetail } from '@/types/post';
import { PostTree } from './post-body';
import { EngagementCounts, postDate, PostRow } from './post-card';
import { PostComments } from './post-comments';
import { PostLikeButton } from './post-like-button';
import { PostToc } from './post-toc';

// Trang đọc bài: đầu bài canh trái, ảnh bìa dải ngang 21:9,
// cột chữ 68ch + mục lục chỉ mục lớn bên phải; cuối bài là tác giả kèm bài khác của họ, khoá liên quan, bài cùng chủ đề.
const DAY = 24 * 3600 * 1000;
const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

function AuthorLine({ post }: { post: PostDetail }) {
  const a = post.author;
  const updated = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > DAY;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <Avatar className="size-9">
        {a.image && <AvatarImage src={a.image} alt="" />}
        <AvatarFallback className="bg-secondary text-sm font-bold text-secondary-foreground">{initial(a.name)}</AvatarFallback>
      </Avatar>
      {a.id ? (
        <Link
          href={`/u/${a.id}`}
          className="rounded-sm font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {a.name}
        </Link>
      ) : (
        <span className="font-semibold text-foreground">{a.name}</span>
      )}
      <span aria-hidden>·</span>
      <time dateTime={post.publishedAt} className="tabular-nums">
        {postDate(post.publishedAt)}
      </time>
      <span aria-hidden>·</span>
      <span>
        <span className="tabular-nums">{post.readingMinutes}</span> phút đọc
      </span>
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <>
          <span aria-hidden>·</span>
          <a href="#comments" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <EngagementCounts likeCount={post.likeCount} commentCount={post.commentCount} />
          </a>
        </>
      )}
      {updated && (
        <>
          <span aria-hidden>·</span>
          <span>
            Cập nhật{' '}
            <time dateTime={post.updatedAt} className="tabular-nums">
              {postDate(post.updatedAt)}
            </time>
          </span>
        </>
      )}
    </div>
  );
}

function Topics({ post }: { post: PostDetail }) {
  if (!post.topics.length) return null;
  return (
    <ul aria-label="Chủ đề" className="flex flex-wrap gap-2">
      {post.topics.map((t) => (
        <li key={t.slug}>
          <Link
            href={`/blog?topic=${t.slug}`}
            className="inline-flex h-7 items-center rounded-full bg-primary-soft px-3 text-xs font-semibold text-primary outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Cuối bài, cùng cột 68ch với nội dung: tim + nút mở bình luận sát nội dung, rồi tác giả, bài liên quan.
// preview: bản xem trước (tác giả soạn bài, trang xem thử) → tim không gọi API, không có bình luận.
function Ending({ post, preview }: { post: PostDetail; preview: boolean }) {
  const a = post.author;
  return (
    <div className="mt-10 flex max-w-[68ch] flex-col gap-12">
      <div className="flex items-center gap-2">
        <PostLikeButton slug={post.slug} initialCount={post.likeCount} preview={preview} />
        {!preview && (
          <a href="#comments" aria-label={`Xem ${post.commentCount} bình luận`} className={buttonVariants({ variant: 'outline' })}>
            <MessageCircle data-icon="inline-start" />
            <span className="tabular-nums">{post.commentCount}</span>
          </a>
        )}
      </div>
      <section aria-labelledby="about-author" className="border-y py-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            {a.image && <AvatarImage src={a.image} alt="" />}
            <AvatarFallback className="bg-secondary text-xl font-extrabold text-secondary-foreground">{initial(a.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 id="about-author" className="text-base font-bold text-foreground">
              {a.name}
            </h2>
            {a.headline && <p className="mt-0.5 text-sm text-muted-foreground">{a.headline}</p>}
            {a.bio && <p className="mt-2 line-clamp-3 text-sm leading-relaxed [overflow-wrap:anywhere] text-foreground">{a.bio}</p>}
            {a.id && (
              <Link href={`/u/${a.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}>
                Xem trang cá nhân
                <ArrowRight data-icon="inline-end" />
              </Link>
            )}
          </div>
        </div>

        {post.fromAuthor.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Bài viết khác của {a.name}</h3>
            <ul className="mt-2 flex flex-col">
              {post.fromAuthor.map((p) => (
                <li key={p.id}>
                  <PostRow post={p} showAuthor={false} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>


      {post.relatedCourse && (
        <section aria-labelledby="related-course">
          <h2 id="related-course" className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Khoá học liên quan
          </h2>
          <div className="max-w-sm">
            <CatalogCourseCard course={post.relatedCourse} />
          </div>
        </section>
      )}

      {post.more.length > 0 && (
        <section aria-labelledby="more-posts">
          <h2 id="more-posts" className="mb-2 text-xl font-bold tracking-tight text-foreground">
            Bài cùng chủ đề
          </h2>
          <ul className="flex flex-col gap-1">
            {post.more.map((p) => (
              <li key={p.id}>
                <PostRow post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function PostArticle({ post, actions, preview = false }: { post: PostDetail; actions?: React.ReactNode; preview?: boolean }) {
  const { tree, headings } = renderPostHtml(post.bodyHtml);
  return (
    <article className="mx-auto max-w-5xl px-4 pb-24">
      <header className="flex flex-col gap-5 border-b pt-10 pb-8 md:pt-14">
        <h1 className="max-w-3xl text-3xl leading-tight font-extrabold tracking-tight text-pretty [overflow-wrap:anywhere] text-foreground md:text-4xl">
          {post.title}
        </h1>
        <p className="max-w-[68ch] text-base leading-relaxed [overflow-wrap:anywhere] text-muted-foreground md:text-lg">{post.excerpt}</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <AuthorLine post={post} />
          <Topics post={post} />
        </div>
        {actions}
      </header>
      {post.coverUrl && (
        <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-2xl border bg-muted">
          <Image src={post.coverUrl} alt="" fill unoptimized priority sizes="(min-width:1024px) 992px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,68ch)_13rem] lg:justify-between">
        <div className="min-w-0">
          <PostTree tree={tree} />
          <Ending post={post} preview={preview} />
        </div>
        <PostToc headings={headings.filter((h) => h.level === 2)} className="sticky top-24 hidden self-start lg:block" />
      </div>
      {/* Drawer, mở bằng link "#comments": nằm ngoài luồng nội dung. */}
      {!preview && <PostComments slug={post.slug} postAuthorId={post.author.id} />}
    </article>
  );
}
