'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { LogOut, MessageCircle, Moon, Search, ShieldCheck, ShoppingCart, Sun, User, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { isInstructor, isStaff, teachHref } from '@/lib/instructor-role';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/lib/cart-store';
import { accountLinks } from '@/components/layout/account-links';
import { CourseSearch } from '@/components/layout/course-search';
import { ExploreMenu } from '@/components/layout/explore-menu';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SignOutDialog } from '@/components/layout/sign-out-dialog';
import type { CategoryNode } from '@/types';

// Bố cục theo Udemy: < lg = ☰ · logo giữa · 🔍 🛒; ≥ lg = đầy đủ.
export default function Header({ categories }: { categories: CategoryNode[] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;
  // Tài khoản nghiệp vụ không mua/học/dạy (BE trả 403) → ẩn giỏ, link học viên, "Dạy học"; thay bằng "Khu quản trị".
  const staff = isStaff(user);

  const cartCount = useCartStore((s) => s.cart?.items.length ?? 0);

  // Badge giỏ: chỉ tải khi có session (khách không gọi → không dính interceptor 401). Đăng xuất/đổi tài khoản → xoá giỏ cũ.
  useEffect(() => {
    if (!userId || staff) return;
    useCartStore.getState().load().catch(() => {});
    return () => useCartStore.getState().reset();
  }, [userId, staff]);

  const iconLink = 'relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="relative mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4">
        <div className="lg:hidden">
          <MobileNav categories={categories} user={user} isPending={isPending} onSignOut={() => setSignOutOpen(true)} />
        </div>

        {/* Logo: giữa trên mobile, trái trên desktop */}
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:static lg:mr-1 lg:translate-x-0"
        >
          <LogoMark />
          <span className="hidden text-lg font-bold text-foreground sm:block">
            Skill<span className="text-primary">Path</span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <ExploreMenu categories={categories} />
        </div>

        <CourseSearch className="mx-2 hidden max-w-2xl flex-1 lg:flex" />

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={staff ? '/admin' : teachHref(user)}
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary lg:block"
          >
            {staff ? 'Khu quản trị' : 'Dạy học'}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-full lg:inline-flex"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Đổi giao diện sáng/tối"
          >
            {/* CSS-driven icon swap avoids a hydration mismatch before the theme is known */}
            <Sun size={18} className="hidden dark:block" />
            <Moon size={18} className="dark:hidden" />
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

          <Separator orientation="vertical" className="mx-1 hidden h-6 data-vertical:self-center lg:block" />

          {!staff && (
            <Link href="/cart" className={iconLink} aria-label={user ? `Giỏ hàng (${cartCount} khoá)` : 'Giỏ hàng'}>
              <ShoppingCart size={18} className="text-foreground" />
              {user && cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white ring-2 ring-card">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <>
              <Link href="/messages" className={cn(iconLink, 'hidden lg:flex')} aria-label="Tin nhắn">
                <MessageCircle size={18} className="text-foreground" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-card" />
              </Link>
              <NotificationPanel isInstructor={isInstructor(user)} />
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
                  <Avatar className="size-8 ring-2 ring-primary/20">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" positionMethod="fixed" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {staff ? (
                    <DropdownMenuItem className="text-primary focus:text-primary" render={<Link href="/admin" />}>
                      <ShieldCheck size={15} />
                      Khu quản trị
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {accountLinks.map(({ icon: Icon, label, to }) => (
                        <DropdownMenuItem key={to} render={<Link href={to} />}>
                          <Icon size={15} className="text-muted-foreground" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-primary focus:text-primary" render={<Link href={teachHref(user)} />}>
                        <User size={15} />
                        Chuyển sang Giảng viên
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setSignOutOpen(true)}>
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
          <CourseSearch autoFocus onSubmitted={() => setSearchOpen(false)} />
        </div>
      )}

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </header>
  );
}
