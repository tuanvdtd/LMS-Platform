import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PostHighlights } from '@/types/post';

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

// Cột phải /blog: bài được thích nhiều gần đây + tác giả nổi bật. Danh sách chữ, không đóng khung thẻ.
export function BlogAside({ data }: { data: PostHighlights }) {
  return (
    <div className="flex flex-col gap-10">
      {data.popular.length > 0 && (
        <section aria-labelledby="blog-popular">
          <h2 id="blog-popular" className="text-sm font-bold text-foreground">
            Nổi bật {data.days} ngày qua
          </h2>
          <ol className="mt-3 flex flex-col gap-4">
            {data.popular.map((p, i) => (
              <li key={p.slug} className="flex gap-3">
                <span aria-hidden className="w-5 shrink-0 text-lg leading-6 font-extrabold text-muted-foreground/60 tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="line-clamp-2 rounded-sm text-sm leading-snug font-semibold [overflow-wrap:anywhere] text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5" aria-hidden />
                      <span className="tabular-nums">{p.likeCount}</span>
                      <span className="sr-only">lượt thích</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3.5" aria-hidden />
                      <span className="tabular-nums">{p.commentCount}</span>
                      <span className="sr-only">bình luận</span>
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {data.authors.length > 0 && (
        <section aria-labelledby="blog-authors">
          <h2 id="blog-authors" className="text-sm font-bold text-foreground">
            Tác giả nổi bật
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {data.authors.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/u/${a.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg p-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Avatar className="size-9">
                    {a.image && <AvatarImage src={a.image} alt="" />}
                    <AvatarFallback className="bg-secondary text-sm font-bold text-secondary-foreground">{initial(a.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">{a.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="tabular-nums">{a.postCount}</span> bài · <span className="tabular-nums">{a.likeCount}</span> lượt thích
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
