import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categoryHref } from '@/lib/category-links';
import type { CategoryNode } from '@/types';
import { CategoryIcon } from './category-icon';

export function CategoryCards({ categories }: { categories: CategoryNode[] }) {
  if (!categories.length) return null;
  return (
    <section aria-labelledby="guest-categories" className="border-y bg-secondary">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20">
        <div className="mb-8 max-w-2xl">
          <h2 id="guest-categories" className="text-2xl font-bold text-foreground md:text-3xl">Khám phá theo lĩnh vực</h2>
          <p className="mt-2 text-secondary-foreground">Chỉ các chủ đề công nghệ thông tin, mỗi khoá đều qua kiểm duyệt.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={categoryHref(c.slug)}
              className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs outline-none transition-[box-shadow,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-[var(--primary-light)] text-primary">
                <CategoryIcon slug={c.slug} className="size-5" />
              </span>
              <div>
                <p className="font-bold group-hover:text-primary">{c.name}</p>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {c.children.slice(0, 3).map((s) => <li key={s.slug} className="truncate">{s.name}</li>)}
                </ul>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary">
                Xem khoá học <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
