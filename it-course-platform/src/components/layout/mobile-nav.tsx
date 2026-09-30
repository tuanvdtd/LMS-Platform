'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, MessageCircle, Moon, Sun, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryHref, topicHref } from '@/lib/category-links';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { accountLinks } from '@/components/layout/account-links';
import type { CategoryNode } from '@/types';

type NavUser = { name: string; email: string };

// 3 màn nằm ngang trong một dải rộng 300%, trượt theo độ sâu của stack.
const SLIDE = ['translate-x-0', '-translate-x-1/3', '-translate-x-2/3'] as const;

export function MobileNav({
  categories,
  user,
  isPending,
  onSignOut,
}: {
  categories: CategoryNode[];
  user: NavUser | undefined;
  isPending: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<string[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const l1 = categories.find((c) => c.slug === stack[0]);
  const l2 = l1?.children.find((c) => c.slug === stack[1]);
  const close = () => setOpen(false);
  const stripRef = useRef<HTMLElement>(null);
  const prevDepth = useRef(0);

  // Chuyển màn (drill/back) → đưa focus vào màn mới; lần mở đầu để Sheet tự focus.
  useEffect(() => {
    const prev = prevDepth.current;
    prevDepth.current = stack.length;
    if (!open || prev === stack.length) return;
    (stripRef.current?.children[stack.length]?.querySelector('a,button') as HTMLElement | null)?.focus({ preventScroll: true });
  }, [stack.length, open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setStack([]);
          prevDepth.current = 0;
        }
      }}
    >
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Mở menu" />}>
        <Menu size={20} />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 overflow-hidden p-0 data-[side=left]:w-72" showCloseButton={false}>
        <SheetTitle className="sr-only">Điều hướng</SheetTitle>
        <SheetClose render={<Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 z-10" aria-label="Đóng" />}>
          <X size={16} />
        </SheetClose>
        <nav aria-label="Điều hướng" ref={stripRef} className={cn('flex h-full w-[300%] transition-transform duration-200', SLIDE[stack.length])}>
          {/* Màn gốc */}
          <Screen active={stack.length === 0}>
            {isPending ? null : user ? (
              <div className="border-b py-3 pl-4 pr-12">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-b py-3 pl-2 pr-12">
                <Link href="/login" onClick={close} className="px-2 py-2 text-sm font-medium text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">Đăng nhập</Link>
                <Link href="/register" onClick={close} className="px-2 py-2 text-sm font-medium text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">Đăng ký</Link>
              </div>
            )}
            <SectionTitle>Danh mục</SectionTitle>
            {categories.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">Không tải được danh mục</p>
            )}
            {categories.map((c) =>
              c.children.length > 0 ? (
                <DrillRow key={c.slug} onClick={() => setStack([c.slug])}>{c.name}</DrillRow>
              ) : (
                <Link key={c.slug} href={categoryHref(c.slug)} onClick={close} className="block px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  {c.name}
                </Link>
              ),
            )}
            {user && (
              <div className="mt-2 border-t py-2">
                {/* Header mobile ẩn 💬 🔔 → đưa vào drawer */}
                <Link href="/messages" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  <MessageCircle size={15} className="text-muted-foreground" />
                  Tin nhắn
                </Link>
                <Link href="/notifications" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  <Bell size={15} className="text-muted-foreground" />
                  Thông báo
                </Link>
                {accountLinks.map(({ icon: Icon, label, to }) => (
                  <Link key={to} href={to} onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                    <Icon size={15} className="text-muted-foreground" />
                    {label}
                  </Link>
                ))}
                <Link href="/instructor" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  <User size={15} />
                  Chuyển sang Giảng viên
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            )}
            <div className="mt-2 border-t py-2">
              <Link href="/teach" onClick={close} className="block px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">Dạy học</Link>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none"
              >
                <Sun size={15} className="hidden dark:block" />
                <Moon size={15} className="dark:hidden" />
                Đổi giao diện sáng/tối
              </button>
            </div>
          </Screen>

          {/* Màn cấp 1 */}
          <Screen active={stack.length === 1}>
            {l1 && (
              <>
                <BackRow onClick={() => setStack([])}>Menu</BackRow>
                <Link href={categoryHref(l1.slug)} onClick={close} className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  Tất cả {l1.name}
                </Link>
                {l1.children.map((c) =>
                  c.topics.length > 0 ? (
                    <DrillRow key={c.slug} onClick={() => setStack([l1.slug, c.slug])}>{c.name}</DrillRow>
                  ) : (
                    <Link key={c.slug} href={categoryHref(l1.slug, c.slug)} onClick={close} className="block px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                      {c.name}
                    </Link>
                  ),
                )}
              </>
            )}
          </Screen>

          {/* Màn cấp 2 */}
          <Screen active={stack.length === 2}>
            {l1 && l2 && (
              <>
                <BackRow onClick={() => setStack([l1.slug])}>{l1.name}</BackRow>
                <Link href={categoryHref(l1.slug, l2.slug)} onClick={close} className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                  Tất cả {l2.name}
                </Link>
                <SectionTitle>Các chủ đề phổ biến</SectionTitle>
                {l2.topics.map((t) => (
                  <Link key={t.slug} href={topicHref(t.slug)} onClick={close} className="block px-4 py-2 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
                    {t.name}
                  </Link>
                ))}
              </>
            )}
          </Screen>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// pr-12 ở dòng đầu mỗi màn: chừa chỗ nút ✕ (SheetClose, absolute top-3 right-3).
function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div inert={!active} className="h-full w-1/3 overflow-y-auto pb-6">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-1 pt-4 text-xs font-bold uppercase text-muted-foreground">{children}</p>;
}

function DrillRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
      {children}
      <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

function BackRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 border-b bg-muted py-3 pl-4 pr-12 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring outline-none">
      <ChevronLeft size={16} />
      {children}
    </button>
  );
}
