'use client';

import { ThemeProvider } from 'next-themes';
import { ServerErrorContent } from '@/components/shared/server-error-content';
import { cn } from '@/lib/utils';
import { fontVariables } from './fonts';
import './globals.css';

// Thay cả root layout: không có CSS, font, theme của layout nên phải tự nạp lại
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn('h-full bg-background antialiased font-sans', fontVariables)}>
      <body className="min-h-full bg-background text-foreground">
        <title>Đã có lỗi xảy ra · Aolumi</title>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ServerErrorContent error={error} retry={retry} standalone />
        </ThemeProvider>
      </body>
    </html>
  );
}
