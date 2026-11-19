import Image from 'next/image';
import Link from 'next/link';
import { FileText, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PostCard } from '@/types/post';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
export const postDate = (iso: string) => dateFmt.format(new Date(iso));

// Số tim / bình luận trên thẻ và trang đọc. Cả hai bằng 0 → không hiện gì (không hiện "0").
export function EngagementCounts({ likeCount, commentCount }: { likeCount: number; commentCount: number }) {
  if (!likeCount && !commentCount) return null;
  return (
    <span className="inline-flex items-center gap-2.5">
      {likeCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" aria-hidden />
          <span className="tabular-nums">{likeCount}</span>
          <span className="sr-only">lượt thích</span>
        </span>
      )}
      {commentCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-3.5" aria-hidden />
          <span className="tabular-nums">{commentCount}</span>
          <span className="sr-only">bình luận</span>
        </span>
      )}
    </span>
  );
}

const hasEngagement = (p: PostCard) => p.likeCount > 0 || p.commentCount > 0;

// Thẻ bài viết: /blog, cuối trang đọc, tab Bài viết ở trang cá nhân. Cả thẻ là một link nên tên tác giả là chữ thường.
// featured: bài mới nhất ở đầu /blog, ảnh và chữ nằm ngang từ md.
export function PostCardView({ post, featured = false }: { post: PostCard; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn('group card-interactive flex h-full flex-col overflow-hidden', featured && 'md:flex-row')}
    >
      <div
        className={cn(
          'relative flex aspect-video shrink-0 items-center justify-center overflow-hidden bg-secondary',
          featured && 'md:aspect-auto md:min-h-72 md:w-3/5',
        )}
      >
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt=""
            fill
            unoptimized
            sizes={featured ? '(min-width:768px) 60vw, 100vw' : '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'}
            className="object-cover"
          />
        ) : (
          <FileText className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col gap-2.5 p-4', featured && 'md:justify-center md:gap-4 md:p-8')}>
        <h3
          className={cn(
            'line-clamp-2 leading-snug font-bold [overflow-wrap:anywhere] text-foreground',
            featured ? 'text-xl md:line-clamp-3 md:text-3xl md:leading-tight md:font-extrabold' : 'text-lg',
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p className={cn('text-sm leading-relaxed [overflow-wrap:anywhere] text-muted-foreground', featured ? 'line-clamp-3 md:text-base' : 'line-clamp-2')}>
            {post.excerpt}
          </p>
        )}
        {post.topics.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {post.topics.slice(0, 2).map((t) => (
              <li key={t.slug} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                {t.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.author.name}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt} className="tabular-nums">
            {postDate(post.publishedAt)}
          </time>
          <span aria-hidden>·</span>
          <span>
            <span className="tabular-nums">{post.readingMinutes}</span> phút đọc
          </span>
          {hasEngagement(post) && (
            <>
              <span aria-hidden>·</span>
              <EngagementCounts likeCount={post.likeCount} commentCount={post.commentCount} />
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

// Dòng bài gọn ở cuối trang đọc: ảnh nhỏ bên trái, tiêu đề, dòng phụ. Cả dòng là một link.
// showAuthor false: danh sách "bài khác của tác giả" (đã biết tác giả) → hiện ngày đăng thay cho tên.
export function PostRow({ post, showAuthor = true }: { post: PostCard; showAuthor?: boolean }) {
  const a = post.author;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group -mx-3 flex items-center gap-4 rounded-xl p-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative flex aspect-[3/2] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-secondary sm:w-32">
        {post.coverUrl ? (
          <Image src={post.coverUrl} alt="" fill unoptimized sizes="128px" className="object-cover" />
        ) : (
          <FileText className="size-5 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="line-clamp-2 leading-snug font-bold [overflow-wrap:anywhere] text-foreground transition-colors group-hover:text-primary">{post.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          {showAuthor ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Avatar className="size-5">
                {a.image && <AvatarImage src={a.image} alt="" />}
                <AvatarFallback className="bg-secondary text-[0.625rem] font-bold text-secondary-foreground">
                  {a.name.trim().charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-foreground">{a.name}</span>
            </span>
          ) : (
            <time dateTime={post.publishedAt} className="tabular-nums">
              {postDate(post.publishedAt)}
            </time>
          )}
          <span aria-hidden>·</span>
          <span>
            <span className="tabular-nums">{post.readingMinutes}</span> phút đọc
          </span>
          {hasEngagement(post) && (
            <>
              <span aria-hidden>·</span>
              <EngagementCounts likeCount={post.likeCount} commentCount={post.commentCount} />
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
