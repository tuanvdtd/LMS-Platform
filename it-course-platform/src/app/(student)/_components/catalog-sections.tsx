import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { listCourses } from '@/lib/api/catalog';
import { categoryHref, topicHref } from '@/lib/category-links';
import { cn } from '@/lib/utils';
import type { CategoryNode, TopicLink } from '@/types';
import { CatalogStarterTabs } from './catalog-starter-tabs';

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

// Args dùng chung cho khối "bắt đầu" và số liệu hero → cùng cache key, chỉ 1 request.
export const starterArgs = (scope: { category?: string; topic?: string } = {}) => ({
  page: 1,
  limit: 12,
  ...(scope.category && { category: scope.category }),
  ...(scope.topic && { topic: scope.topic }),
  sort: 'popular' as const,
});

// Thanh danh mục con: nền xám riêng để tách khỏi header site (trắng, có shadow) và hero bên dưới.
export function CatalogSubnav({ parent, activeChild }: { parent: CategoryNode; activeChild?: string }) {
  const items = [
    { label: parent.name, href: categoryHref(parent.slug), active: !activeChild, root: true },
    ...parent.children.map((c) => ({
      label: c.name,
      href: categoryHref(parent.slug, c.slug),
      active: c.slug === activeChild,
      root: false,
    })),
  ];
  return (
    <nav aria-label={`Danh mục ${parent.name}`} className="border-b bg-secondary/70">
      <ul className="mx-auto flex max-w-screen-xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none]">
        {items.map((it) => (
          <li key={it.href} className={cn('shrink-0', it.root && 'mr-2 border-r pr-3')}>
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-12 items-center px-3 text-sm whitespace-nowrap transition-colors',
                'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors',
                it.root ? 'font-bold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground',
                it.active && 'text-primary after:bg-primary',
                focusRing,
              )}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Tiêu đề section: tiêu đề lớn + mô tả, tuỳ chọn hành động bên phải.
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-balance text-foreground md:text-2xl">{title}</h2>
        {description && <p className="max-w-2xl text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// "Khoá học để bạn bắt đầu": 2 tab Phổ biến nhất / Mới nhất, dữ liệu thật từ API catalog.
export async function CatalogStarter({ category, topic }: { category?: string; topic?: string }) {
  const args = starterArgs({ category, topic });
  const [popular, newest] = await Promise.all([listCourses(args), listCourses({ ...args, sort: 'newest' })]);
  if (!popular?.items.length) return null;
  const toCards = (items: typeof popular.items) => items.map((c) => <CatalogCourseCard key={c.id} course={c} />);

  return (
    <section className="border-b bg-background py-8 md:py-10">
      <div className="mx-auto max-w-screen-xl px-4">
        <SectionHeading
          title="Khoá học để bạn bắt đầu"
          description="Khám phá các khoá học do giảng viên giàu kinh nghiệm thực tế giảng dạy."
        />
        <CatalogStarterTabs
          tabs={[
            { value: 'popular', label: 'Phổ biến nhất', items: toCards(popular.items) },
            ...(newest?.items.length ? [{ value: 'newest', label: 'Mới nhất', items: toCards(newest.items) }] : []),
          ]}
        />
      </div>
    </section>
  );
}

export function CatalogStarterSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:py-10" aria-hidden>
      <Skeleton className="h-7 w-72 max-w-full md:h-8" />
      <Skeleton className="mt-1 h-5 w-96 max-w-full" />
      <div className="mt-6 flex gap-4 border-b pb-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(i === 1 && 'hidden sm:block', i > 1 && 'hidden lg:block')}>
            <CourseCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lưới ô liên kết (chủ đề / danh mục) trên dải nền xám — chỉ dữ liệu thật từ category tree, tối đa 10 ô.
export function LinkTiles({
  title,
  description,
  links,
}: {
  title: string;
  description?: string;
  links: { id: string; name: string; href: string; meta?: string }[];
}) {
  if (!links.length) return null;
  return (
    <section className="border-b bg-secondary/60 py-8 md:py-10">
      <div className="mx-auto max-w-screen-xl px-4">
        <SectionHeading title={title} description={description} />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {links.slice(0, 10).map((l) => (
            <li key={l.id}>
              <Link
                href={l.href}
                className={cn(
                  'group flex min-h-14 items-center justify-between gap-2 rounded-xl border bg-card px-3 py-3 sm:min-h-16 sm:px-4 transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  focusRing,
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{l.name}</span>
                  {l.meta && <span className="text-xs text-muted-foreground">{l.meta}</span>}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const topicLinks = (topics: TopicLink[]) => topics.map((t) => ({ id: t.id, name: t.name, href: topicHref(t.slug) }));
