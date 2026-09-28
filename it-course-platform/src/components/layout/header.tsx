'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Search, ShoppingCart, Bell, ChevronDown, Moon, Sun, Menu, X, BookOpen,
  User, LogOut, Award, Settings, BarChart2, Briefcase, MessageCircle
} from 'lucide-react';
import { demoStudent } from '@/lib/mocks/data';
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
import { Input } from '@/components/ui/input';

export default function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const tracks = [
    { id: 'frontend', label: 'Frontend', icon: '⚡' },
    { id: 'backend', label: 'Backend', icon: '⚙️' },
    { id: 'fullstack', label: 'Fullstack', icon: '🔗' },
    { id: 'data', label: 'Data & AI', icon: '📊' },
    { id: 'devops', label: 'DevOps', icon: '🚀' },
    { id: 'mobile', label: 'Mobile', icon: '📱' },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block" style={{ color: 'var(--foreground)' }}>
            Skill<span className="text-blue-600">Path</span>
          </span>
        </Link>

        {/* Categories */}
        <div className="relative hidden lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="gap-1 px-2" aria-label="Danh mục khoá học" />}
            >
              Danh mục <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {tracks.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  className="gap-3 px-3 py-2.5"
                  render={<Link href={`/categories/${t.id}`} />}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}
          >
            <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm khoá học, kỹ năng..."
              className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          {/* Teach */}
          <Link
            href="/teach"
            className="hidden md:block text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            Dạy học
          </Link>

          {/* Dark mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Đổi giao diện sáng/tối"
          >
            {/* CSS-driven icon swap avoids a hydration mismatch before the theme is known */}
            <Sun size={16} className="hidden dark:block" style={{ color: 'var(--foreground)' }} />
            <Moon size={16} className="dark:hidden" style={{ color: 'var(--foreground)' }} />
          </Button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={`Giỏ hàng (${cartCount} khoá)`}
          >
            <ShoppingCart size={18} style={{ color: 'var(--foreground)' }} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link href="/messages" className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Tin nhắn">
            <MessageCircle size={18} style={{ color: 'var(--foreground)' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Thông báo">
            <Bell size={18} style={{ color: 'var(--foreground)' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </Link>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu tài khoản" />}
            >
              <Avatar className="size-7">
                <AvatarImage src={demoStudent.avatar} alt={demoStudent.name} />
                <AvatarFallback>{demoStudent.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold text-foreground">{demoStudent.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{demoStudent.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
                {[
                  { icon: BookOpen, label: 'Học tập của tôi', to: '/my-learning' },
                  { icon: BarChart2, label: 'Hồ sơ năng lực', to: '/skills' },
                  { icon: Award, label: 'Chứng chỉ', to: '/certificates' },
                  { icon: Briefcase, label: 'Lịch sử mua hàng', to: '/orders' },
                  { icon: Settings, label: 'Cài đặt', to: '/settings' },
                ].map(({ icon: Icon, label, to }) => (
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
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <LogOut size={15} />
                    Đăng xuất
                  </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t px-4 py-3 space-y-1" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {tracks.map((t) => (
            <Link
              key={t.id}
              href={`/categories/${t.id}`}
              className="flex items-center gap-2 py-2 text-sm"
              style={{ color: 'var(--foreground)' }}
              onClick={() => setMenuOpen(false)}
            >
              {t.icon} {t.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
