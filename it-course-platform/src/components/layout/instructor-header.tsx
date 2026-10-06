'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, BookMarked, LogOut, Menu, MessagesSquare, Moon, ShieldCheck, Sun, User, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
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
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { INSTRUCTOR_NAV } from '@/components/layout/instructor-sidebar';

// Header khu giảng viên (kiểu Udemy instructor): không tìm khoá / danh mục / giỏ hàng; có nhãn "Giảng viên"
// và lối chuyển về Học viên. < lg: sidebar ẩn, ☰ mở drawer chứa đúng các mục sidebar giảng viên.
export default function InstructorHeader() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    const { error } = await authClient.signOut().catch(() => ({ error: true }));
    if (error) return;
    router.replace('/');
    router.refresh();
  }

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4">
        <div className="lg:hidden">
          {/* usePathname treo khi prerender (cacheComponents) → Suspense */}
          <Suspense fallback={<Button variant="ghost" size="icon" disabled aria-label="Mở menu"><Menu /></Button>}>
            <InstructorMobileNav user={user} onSignOut={signOut} onToggleTheme={toggleTheme} />
          </Suspense>
        </div>

        <Link href="/instructor" className="flex items-center gap-2">
          <LogoMark />
          <span className="hidden text-lg font-bold sm:block">
            Skill<span className="text-primary">Path</span>
          </span>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            Giảng viên
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link href="/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden lg:inline-flex')}>
            <BookMarked data-icon="inline-start" />
            Học viên
          </Link>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={toggleTheme} aria-label="Đổi giao diện sáng/tối">
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
          <Link href="/instructor/messages" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Tin nhắn học viên">
            <MessagesSquare />
          </Link>
          <Link href="/notifications" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Thông báo">
            <Bell />
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex" aria-label="Menu tài khoản" />}
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
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/instructor/profile" />}>
                    <User />
                    Hồ sơ giảng viên
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/instructor/verification" />}>
                    <ShieldCheck />
                    Xác minh
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-primary focus:text-primary" render={<Link href="/" />}>
                    <BookMarked />
                    Chuyển sang Học viên
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={signOut}>
                    <LogOut />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

const rowClass =
  'flex items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

function InstructorMobileNav({
  user,
  onSignOut,
  onToggleTheme,
}: {
  user: { name: string; email: string } | undefined;
  onSignOut: () => void;
  onToggleTheme: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  // '/instructor' là trang gốc nên phải khớp chính xác (giống InstructorSidebar)
  const isActive = (to: string) => pathname === to || (to !== '/instructor' && pathname.startsWith(to + '/'));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Mở menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 overflow-y-auto p-0 data-[side=left]:w-72" showCloseButton={false}>
        <SheetTitle className="sr-only">Điều hướng giảng viên</SheetTitle>
        <SheetClose render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" aria-label="Đóng" />}>
          <X />
        </SheetClose>

        {user && (
          <div className="border-b py-3 pr-12 pl-4">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}

        <nav aria-label="Điều hướng giảng viên" className="flex flex-col py-2">
          {INSTRUCTOR_NAV.map(({ icon: Icon, label, to, children }) =>
            children ? (
              <div key={to} className="flex flex-col">
                <p className="flex items-center gap-3 px-4 pt-3 pb-1 text-xs font-bold text-muted-foreground uppercase">
                  <Icon size={15} />
                  {label}
                </p>
                {children.map((c) => (
                  <Link
                    key={c.to}
                    href={c.to}
                    onClick={close}
                    aria-current={isActive(c.to) ? 'page' : undefined}
                    className={cn(rowClass, 'pl-11', isActive(c.to) && 'bg-primary/10 font-semibold text-primary')}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={to}
                href={to}
                onClick={close}
                aria-current={isActive(to) ? 'page' : undefined}
                className={cn(rowClass, isActive(to) && 'bg-primary/10 font-semibold text-primary')}
              >
                <Icon size={16} className="text-muted-foreground" />
                {label}
              </Link>
            ),
          )}
        </nav>

        <Separator />
        <div className="flex flex-col py-2">
          <Link href="/" onClick={close} className={cn(rowClass, 'text-primary')}>
            <BookMarked size={16} />
            Chuyển sang Học viên
          </Link>
          <button type="button" onClick={onToggleTheme} className={cn(rowClass, 'w-full text-left')}>
            <Sun size={16} className="hidden text-muted-foreground dark:block" />
            <Moon size={16} className="text-muted-foreground dark:hidden" />
            Đổi giao diện sáng/tối
          </button>
          {user && (
            <button
              type="button"
              onClick={() => {
                close();
                onSignOut();
              }}
              className={cn(rowClass, 'w-full text-left text-destructive')}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
