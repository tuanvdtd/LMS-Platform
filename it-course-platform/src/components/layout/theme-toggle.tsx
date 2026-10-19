'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

// Icon đổi bằng CSS (dark:) để không lệch hydration trước khi biết theme (như header.tsx).
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className={className}>
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
      Đổi giao diện sáng/tối
    </button>
  );
}
