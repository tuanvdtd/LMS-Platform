import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { fullTime, timeAgo } from '@/lib/time-ago';
import type { PostCard } from '@/types/post';
import { PostLikeButton } from './post-like-button';
import { ShareButton } from './share-button';

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

// Hashtag chủ đề: bỏ phần giải nghĩa trong ngoặc ("DevOps (Phát triển và vận hành)" → "#DevOps").
export const topicTag = (name: string) => `#${name.replace(/\s*\(.*\)\s*$/, '')}`;

// Một bài trong luồng /blog (kiểu bảng tin, không đóng khung thẻ): tác giả + thời gian, tiêu đề, mô tả, chủ đề, ảnh, hàng tương tác.
// Server component; chỉ nút tim và nút chia sẻ chạy ở client.
export function FeedPost({ post }: { post: PostCard }) {
  const a = post.author;
  const href = `/blog/${post.slug}`;
  return (
    <article className="py-7">
      <header className="flex items-center gap-3">
        <Avatar className="size-10">
          {a.image && <AvatarImage src={a.image} alt="" />}
          <AvatarFallback className="bg-secondary text-sm font-bold text-secondary-foreground">{initial(a.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          {a.id ? (
            <Link
              href={`/u/${a.id}`}
              className="truncate rounded-sm text-sm font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {a.name}
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold text-foreground">{a.name}</span>
          )}
          <p className="text-xs text-muted-foreground">
            <time dateTime={post.publishedAt} title={fullTime(post.publishedAt)}>
              {timeAgo(post.publishedAt)}
            </time>
            <span aria-hidden> · </span>
            <span className="tabular-nums">{post.readingMinutes}</span> phút đọc
          </p>
        </div>
      </header>

      <Link href={href} className="group mt-4 block rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <h2 className="text-xl leading-snug font-bold text-pretty [overflow-wrap:anywhere] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">{post.excerpt}</p>
        )}
      </Link>

      {post.topics.length > 0 && (
        <ul aria-label="Chủ đề" className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {post.topics.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/blog?topic=${t.slug}`}
                className="rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {topicTag(t.name)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {post.coverUrl && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="relative mt-4 block aspect-video overflow-hidden rounded-xl border bg-muted"
        >
          <Image src={post.coverUrl} alt="" fill unoptimized sizes="(min-width:1024px) 672px, 100vw" className="object-cover" />
        </Link>
      )}

      <footer className="mt-3 -ml-2.5 flex items-center gap-1">
        <PostLikeButton slug={post.slug} initialCount={post.likeCount} inFeed />
        <Link href={`${href}#comments`} className={buttonVariants({ variant: 'ghost' })}>
          <MessageCircle data-icon="inline-start" />
          <span className="tabular-nums">{post.commentCount}</span>
          <span className="sr-only">bình luận</span>
        </Link>
        <ShareButton slug={post.slug} />
      </footer>
    </article>
  );
}
