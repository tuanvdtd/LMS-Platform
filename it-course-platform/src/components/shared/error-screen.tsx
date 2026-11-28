'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { LogoMark } from '@/components/shared/logo-mark';
import type { ErrorScene } from '@/components/shared/lumi-moment';
import { cn } from '@/lib/utils';

const ErrorLumi = dynamic(() => import('@/components/shared/lumi-moment').then((m) => m.ErrorLumi), { ssr: false });

// standalone: trang không có header của site (lỗi 500 cấp root, 403 ngoài khu quản trị) nên tự có logo về trang chủ
export function ErrorScreen({ scene, code, title, children, actions, footnote, standalone }: {
  scene: ErrorScene;
  code?: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  footnote?: React.ReactNode;
  standalone?: boolean;
}) {
  return (
    <div className={cn(standalone && 'min-h-dvh')}>
      {standalone && (
        <header className="flex h-16 items-center justify-center px-4">
          <Link href="/" className="flex items-center gap-2 rounded-md">
            <LogoMark />
            <span className="text-lg font-semibold text-foreground">aolumi</span>
          </Link>
        </header>
      )}
      <section className={cn('px-4 pb-16', standalone ? 'pt-4' : 'pt-10 sm:pt-14')}>
        <div aria-hidden className="mx-auto aspect-[18/11] w-full max-w-[380px]">
          <ErrorLumi scene={scene} className="size-full" />
        </div>
        <div className="mx-auto mt-4 max-w-md text-center">
          {code && <p className="text-sm font-medium text-muted-foreground tabular-nums">{code}</p>}
          <h1 className={cn('text-2xl font-extrabold text-balance', code && 'mt-1')}>{title}</h1>
          <p className="mt-3 text-base text-pretty text-muted-foreground">{children}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>
          {footnote && <div className="mt-8 text-sm text-muted-foreground">{footnote}</div>}
        </div>
      </section>
    </div>
  );
}
