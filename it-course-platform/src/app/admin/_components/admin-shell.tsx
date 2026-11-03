'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgeCheck, ChevronDown, ClipboardCheck, House, LogOut, Menu, Settings, ShieldUser, Wallet, X, type LucideIcon } from 'lucide-react';
import { SignOutDialog } from '@/components/layout/sign-out-dialog';
import { LogoMark } from '@/components/shared/logo-mark';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { listApprovals } from '@/lib/api/course-approvals';
import { listApplications } from '@/lib/api/instructor-application';
import { cn } from '@/lib/utils';

type CountKey = 'courses' | 'applications';
type NavLink = { href: string; label: string; icon: LucideIcon; adminOnly?: true; count?: CountKey };

// adminOnly: moderator không thấy (layout cũng trả 403 nếu mở thẳng URL).
const GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: 'Hàng đợi duyệt',
    links: [
      // Nhóm đã nói "duyệt" → nhãn ngắn, vừa sidebar 256px kèm số đang chờ.
      { href: '/admin/course-approvals', label: 'Khoá học', icon: ClipboardCheck, count: 'courses' },
      { href: '/admin/instructor-applications', label: 'Giảng viên cao cấp', icon: BadgeCheck, adminOnly: true, count: 'applications' },
    ],
  },
  {
    label: 'Vận hành',
    links: [
      { href: '/admin/payouts', label: 'Thanh toán giảng viên', icon: Wallet, adminOnly: true },
      { href: '/admin/moderators', label: 'Moderator', icon: ShieldUser, adminOnly: true },
    ],
  },
  { label: 'Hệ thống', links: [{ href: '/admin/settings', label: 'Cài đặt', icon: Settings, adminOnly: true }] },
];

// Số việc đang chờ trên nav. Tải lại mỗi lần đổi trang → duyệt xong quay về hàng đợi là số đã giảm.
function usePendingCounts(admin: boolean) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Partial<Record<CountKey, number>>>({});
  useEffect(() => {
    let stale = false;
    const set = (k: CountKey) => (d: { total: number }) => {
      if (!stale) setCounts((c) => ({ ...c, [k]: d.total }));
    };
    listApprovals({ status: 'pending', page: 1 }).then(set('courses'), () => undefined);
    if (admin) listApplications({ status: 'pending', page: 1 }).then(set('applications'), () => undefined);
    return () => {
      stale = true;
    };
  }, [admin, pathname]);
  return counts;
}

function NavList({ admin, counts, onNavigate }: { admin: boolean; counts: Partial<Record<CountKey, number>>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Khu quản trị" className="flex flex-col gap-5 p-3">
      {GROUPS.map((g) => {
        const links = g.links.filter((l) => admin || !l.adminOnly);
        if (links.length === 0) return null;
        return (
          <div key={g.label} className="flex flex-col gap-0.5">
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{g.label}</p>
            {links.map((l) => {
              const active = pathname.startsWith(l.href);
              const n = l.count ? counts[l.count] : undefined;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                    active ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-foreground/80 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <l.icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{l.label}</span>
                  {n !== undefined && n > 0 && (
                    <span className="min-w-5 rounded-full bg-warning-soft px-1.5 text-center text-xs font-semibold text-warning tabular-nums" aria-label={`${n} đang chờ`}>
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

type ShellUser = { name: string; email: string; image?: string | null };

// Khung khu quản trị: header trắng + sidebar trái (desktop) / ngăn trượt (mobile), nội dung trên nền muted.
export function AdminShell({ user, admin, children }: { user: ShellUser; admin: boolean; children: React.ReactNode }) {
  const counts = usePendingCounts(admin);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const role = admin ? 'Quản trị viên' : 'Moderator';

  return (
    <div className="min-h-dvh bg-muted">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-2 sm:px-4">
        <Button variant="ghost" size="icon" className="size-10 lg:hidden" aria-label="Mở menu quản trị" onClick={() => setMenuOpen(true)}>
          <Menu />
        </Button>
        <Link href="/admin" className="flex h-10 items-center gap-2 rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <LogoMark className="h-7" />
          <span className="hidden text-base font-bold text-foreground sm:inline">
            Skill<span className="text-primary">Path</span>
          </span>
        </Link>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-ink-foreground">{admin ? 'Quản trị' : 'Kiểm duyệt'}</span>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2" aria-label="Menu tài khoản" />}>
            <Avatar className="size-7">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{user.name}</span>
            <ChevronDown className="hidden text-muted-foreground sm:block" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" positionMethod="fixed" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs font-medium text-primary">{role}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/" />}>
              <House className="text-muted-foreground" />
              Về trang chủ SkillPath
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setSignOutOpen(true)}>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r bg-card lg:block">
          <NavList admin={admin} counts={counts} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="max-w-[85vw] gap-0 p-0 data-[side=left]:w-72">
          <SheetClose render={<Button variant="ghost" size="icon" className="absolute top-1.5 right-1.5 z-10 size-11" aria-label="Đóng" />}>
            <X />
          </SheetClose>
          <SheetHeader className="border-b pr-14">
            <SheetTitle>Khu quản trị</SheetTitle>
          </SheetHeader>
          <NavList admin={admin} counts={counts} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  );
}
