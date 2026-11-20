import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categoryHref } from '@/lib/category-links';
import type { CategoryNode } from '@/types';
import { cn } from '@/lib/utils';
import { CategoryIcon, categoryTone } from './category-icon';
import { Reveal, RevealItem, RevealList } from './guest-motion';

export function CategoryCards({ categories }: { categories: CategoryNode[] }) {
  if (!categories.length) return null;
  return (
    <section aria-labelledby="guest-categories" className="bg-background">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-20 lg:py-28">
        <Reveal className="mb-10 max-w-2xl">
          <h2 id="guest-categories" className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Khám phá theo lĩnh vực</h2>
          <p className="mt-3 text-lg/relaxed text-secondary-foreground">Chỉ các chủ đề công nghệ thông tin, mỗi khoá đều được chuyên gia đúng lĩnh vực duyệt.</p>
        </Reveal>
        <RevealList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <RevealItem key={c.slug}>
            <Link
              href={categoryHref(c.slug)}
              className="group card-interactive flex h-full flex-col gap-4 p-5"
            >
              <span className={cn('grid size-11 place-items-center rounded-xl', categoryTone(c.slug))}>
                <CategoryIcon slug={c.slug} className="size-5.5" />
              </span>
              <div>
                <p className="font-bold">{c.name}</p>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {c.children.slice(0, 3).map((s) => <li key={s.slug} className="truncate">{s.name}</li>)}
                </ul>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary">
                Xem khoá học
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </span>
            </Link>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}
