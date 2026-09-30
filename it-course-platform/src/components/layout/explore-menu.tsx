'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryHref, topicHref } from '@/lib/category-links';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CategoryNode } from '@/types';

// Menu "Khám phá" kiểu Udemy: 3 cột liền nhau (cấp 1 → cấp 2 → chủ đề phổ biến).
// shadcn không có cascading panel nên cột tự dựng bằng Tailwind (spec E6).
// Chuột: hover mở cột kế. Bàn phím: Tab đi trong cột, → mở cột kế và focus dòng đầu,
// ← quay về dòng cha. Không mở cột theo onFocus: Base UI focus dòng đầu khi mở bằng
// click/Enter, và Tab qua cả cột 1 sẽ liên tục đổi cột 2.
export function ExploreMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [l1Slug, setL1Slug] = useState<string | null>(null);
  const [l2Slug, setL2Slug] = useState<string | null>(null);
  const l1 = categories.find((c) => c.slug === l1Slug);
  const l2 = l1?.children.find((c) => c.slug === l2Slug);

  const close = () => setOpen(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(o) => {
        if (!o) {
          setL1Slug(null);
          setL2Slug(null);
        }
      }}
    >
      <PopoverTrigger openOnHover delay={150} render={<Button variant="ghost" size="sm" className="px-3" />}>
        Khám phá
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} aria-label="Danh mục khoá học" className="flex w-auto flex-row gap-0 overflow-hidden p-0">
        {categories.length === 0 ? (
          <p className="w-72 px-4 py-3 text-sm text-muted-foreground">Không tải được danh mục</p>
        ) : (
          <>
            <MenuColumn level={1}>
              {categories.map((c) => (
                <MenuRow
                  key={c.slug}
                  href={categoryHref(c.slug)}
                  active={c.slug === l1Slug}
                  chevron={c.children.length > 0}
                  onActivate={() => {
                    setL1Slug(c.slug);
                    setL2Slug(null);
                  }}
                  onNavigate={close}
                >
                  {c.name}
                </MenuRow>
              ))}
            </MenuColumn>
            {l1 && l1.children.length > 0 && (
              <MenuColumn level={2}>
                {l1.children.map((c) => (
                  <MenuRow
                    key={c.slug}
                    href={categoryHref(l1.slug, c.slug)}
                    active={c.slug === l2Slug}
                    chevron={c.topics.length > 0}
                    onActivate={() => setL2Slug(c.slug)}
                    onNavigate={close}
                    parentLevel={1}
                  >
                    {c.name}
                  </MenuRow>
                ))}
              </MenuColumn>
            )}
            {l2 && l2.topics.length > 0 && (
              <MenuColumn level={3} title="Các chủ đề phổ biến">
                {l2.topics.map((t) => (
                  <MenuRow key={t.slug} href={topicHref(t.slug)} onNavigate={close} parentLevel={2}>
                    {t.name}
                  </MenuRow>
                ))}
              </MenuColumn>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MenuColumn({ level, title, children }: { level: 1 | 2 | 3; title?: string; children: React.ReactNode }) {
  return (
    <div data-menu-col={level} className="max-h-[70vh] w-72 overflow-y-auto border-l py-2 first:border-l-0">
      {title && <p className="px-4 pb-2 pt-2 text-sm font-bold text-muted-foreground">{title}</p>}
      <ul>{children}</ul>
    </div>
  );
}

function MenuRow({
  href,
  active = false,
  chevron = false,
  onActivate,
  onNavigate,
  parentLevel,
  children,
}: {
  href: string;
  active?: boolean;
  chevron?: boolean;
  onActivate?: () => void;
  onNavigate: () => void;
  parentLevel?: 1 | 2; // cột chứa dòng cha, để ← quay về
  children: React.ReactNode;
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>) {
    const col = e.currentTarget.closest('[data-menu-col]');
    const level = Number(col?.getAttribute('data-menu-col'));
    const panel = col?.parentElement;
    if (e.key === 'ArrowRight' && chevron && onActivate) {
      e.preventDefault();
      flushSync(onActivate); // render cột kế trước khi focus
      panel?.querySelector<HTMLElement>(`[data-menu-col="${level + 1}"] a`)?.focus();
    } else if (e.key === 'ArrowLeft' && parentLevel) {
      e.preventDefault();
      panel?.querySelector<HTMLElement>(`[data-menu-col="${parentLevel}"] a[data-active="true"]`)?.focus();
    }
  }

  return (
    <li>
      <Link
        href={href}
        data-active={active}
        onMouseEnter={onActivate}
        onKeyDown={onKeyDown}
        onClick={onNavigate}
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-2 text-sm text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          active && 'bg-muted text-primary',
        )}
      >
        {children}
        {chevron && <ChevronRight size={14} className="shrink-0" />}
      </Link>
    </li>
  );
}
