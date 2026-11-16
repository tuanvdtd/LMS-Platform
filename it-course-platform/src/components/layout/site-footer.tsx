import Link from 'next/link';
import { QrCode, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { CookieSettingsButton } from '@/components/cookie-consent';
import { categoryHref } from '@/lib/category-links';
import type { CategoryNode } from '@/types';

const link = 'inline-flex min-h-8 items-center text-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/50';

export function SiteFooter({ categories }: { categories: CategoryNode[] }) {
  const cols: [string, { label: string; href: string }[]][] = [
    ['Khám phá', [...categories.map((c) => ({ label: c.name, href: categoryHref(c.slug) })), { label: 'Tất cả khoá học', href: '/courses' }]],
    ['Học viên', [{ label: 'Đăng ký miễn phí', href: '/register' }, { label: 'Đăng nhập', href: '/login' }]],
    ['Giảng viên', [{ label: 'Dạy học trên Aolumi', href: '/teach' }]],
  ];
  return (
    <footer className="bg-foreground text-white/70 dark:border-t dark:bg-card">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 md:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4">
          <Link href="/" className="flex w-fit items-center gap-2">
            <LogoMark className="text-[color-mix(in_oklab,var(--primary),white_40%)]" />
            <span className="text-lg font-semibold text-white">aolumi</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed">Nền tảng khoá học IT chấm bài tự động và gợi ý lộ trình theo năng lực thực tế của bạn.</p>
          <ul className="grid gap-2 text-sm">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-white/50" aria-hidden />Mọi khoá học đều qua kiểm duyệt</li>
            <li className="flex items-center gap-2"><QrCode className="size-4 text-white/50" aria-hidden />Chứng chỉ xác thực bằng mã QR</li>
          </ul>
        </div>
        {cols.map(([title, items]) => (
          <nav key={title} aria-label={title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <ul className="grid gap-1">
              {items.map((i) => <li key={i.href}><Link href={i.href} className={link}>{i.label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>© 2026 Aolumi</span>
            <Link href="/terms" className={link}>Điều khoản sử dụng</Link>
            <Link href="/privacy" className={link}>Chính sách bảo mật</Link>
            <CookieSettingsButton className={link} />
          </div>
          <ThemeToggle className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-full px-3 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50" />
        </div>
      </div>
    </footer>
  );
}
