'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, BookOpen, LogOut, MessageCircle, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { accountLinks } from '@/components/layout/account-links';
import { ExploreMenu } from '@/components/layout/explore-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { CategoryNode } from '@/types';

// Bố cục theo Udemy (spec §5.1): < lg = ☰ · logo giữa · 🔍 🛒; ≥ lg = đầy đủ.
export default function Header({
  cartCount = 0,
  categories,
}: {
  cartCount?: number;
  categories: CategoryNode[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    const { error } = await authClient.signOut().catch(() => ({ error: true }));
    if (error) return;
    router.replace('/');
    router.refresh();
  }

  const iconLink = 'relative rounded-lg p-2 transition-colors hover:bg-muted';

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="relative mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        <div className="lg:hidden">
          <MobileNav categories={categories} user={user} isPending={isPending} onSignOut={signOut} />
        </div>

        {/* Logo: giữa trên mobile, trái trên desktop */}
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:static lg:mr-1 lg:translate-x-0"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen size={16} className="text-primary-foreground" />
          </div>
          <span className="hidden text-lg font-bold text-foreground sm:block">
            Skill<span className="text-primary">Path</span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <ExploreMenu categories={categories} />
        </div>

        <SearchForm className="hidden max-w-xl flex-1 lg:flex" />

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/teach"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:block"
          >
            Dạy học
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Đổi giao diện sáng/tối"
          >
            {/* CSS-driven icon swap avoids a hydration mismatch before the theme is known */}
            <Sun size={16} className="hidden dark:block" />
            <Moon size={16} className="dark:hidden" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </Button>

          <Link href="/cart" className={iconLink} aria-label={`Giỏ hàng (${cartCount} khoá)`}>
            <ShoppingCart size={18} className="text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user && (
            <>
              <Link href="/messages" className={`${iconLink} hidden lg:block`} aria-label="Tin nhắn">
                <MessageCircle size={18} className="text-foreground" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
              </Link>
              <Link href="/notifications" className={`${iconLink} hidden lg:block`} aria-label="Thông báo">
                <Bell size={18} className="text-foreground" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
              </Link>
            </>
          )}

          <div className="hidden lg:block">
            {isPending ? (
              <div className="flex size-9 items-center justify-center">
                <Skeleton className="size-7 rounded-full" />
              </div>
            ) : !user ? (
              <div className="ml-1 flex items-center gap-1">
                <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Đăng nhập</Link>
                <Link href="/register" className={buttonVariants({ size: 'sm' })}>Đăng ký</Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu tài khoản" />}
                >
                  <Avatar className="size-7">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {accountLinks.map(({ icon: Icon, label, to }) => (
                    <DropdownMenuItem key={to} render={<Link href={to} />}>
                      <Icon size={15} className="text-muted-foreground" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-primary focus:text-primary" render={<Link href="/instructor" />}>
                    <User size={15} />
                    Chuyển sang Giảng viên
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={signOut}>
                    <LogOut size={15} />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t px-4 py-2 lg:hidden">
          <SearchForm autoFocus onSubmitted={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}

function SearchForm({
  className = 'flex',
  autoFocus,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const [q, setQ] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/courses?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className={className} role="search">
      <div className="flex w-full items-center gap-2 rounded-full border bg-secondary px-3 py-1.5">
        <Search size={16} className="text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          placeholder="Tìm kiếm khoá học, kỹ năng..."
          aria-label="Tìm kiếm khoá học"
          className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </form>
  );
}
