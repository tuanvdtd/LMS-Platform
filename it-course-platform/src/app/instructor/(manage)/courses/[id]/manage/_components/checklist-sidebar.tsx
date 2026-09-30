'use client';

import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChecklistKey } from '@/types/instructor-course';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

type Entry = { label: string; key?: ChecklistKey; page?: 'goals' | 'basics' };

// Mục không có page = "Sắp có" (đợt 2–4).
const GROUPS: { title: string; entries: Entry[] }[] = [
  { title: 'Lên kế hoạch cho khoá học', entries: [{ label: 'Học viên mục tiêu', key: 'goals', page: 'goals' }] },
  { title: 'Tạo nội dung', entries: [{ label: 'Khung chương trình', key: 'curriculum' }] },
  {
    title: 'Xuất bản khoá học',
    entries: [{ label: 'Trang tổng quan', key: 'basics', page: 'basics' }, { label: 'Định giá' }, { label: 'Khuyến mại' }],
  },
];

export function ChecklistSidebar() {
  const { course } = useCourse();
  const pathname = usePathname();
  const base = `/instructor/courses/${course.id}/manage`;

  return (
    <aside className="shrink-0 border-b p-4 md:w-72 md:border-r md:border-b-0">
      <nav className="space-y-6" aria-label="Các bước tạo khoá học">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-2 text-sm font-bold">{group.title}</h2>
            <ul className="space-y-1">
              {group.entries.map((entry) => {
                const item = course.checklist.find((c) => c.key === entry.key);
                if (!entry.page) {
                  return (
                    <li key={entry.label} className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground opacity-60">
                      <Circle size={16} />
                      {entry.label}
                      <span className="ml-auto text-xs">Sắp có</span>
                    </li>
                  );
                }
                const href = `${base}/${entry.page}`;
                const Icon = item?.done ? CheckCircle2 : Circle;
                return (
                  <li key={entry.label}>
                    <GuardedLink
                      href={href}
                      aria-current={pathname === href ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                        pathname === href && 'bg-muted font-semibold',
                      )}
                    >
                      <Icon size={16} className={item?.done ? 'text-primary' : 'text-muted-foreground'} />
                      {entry.label}
                    </GuardedLink>
                    {item && !item.done && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.missing.map((m) => (
                          <li key={m.message}>
                            <GuardedLink
                              href={`${href}#${m.anchor}`}
                              className="text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              {m.message}
                            </GuardedLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <Button className="w-full" disabled>
          Gửi đi để xem xét (Sắp có)
        </Button>
      </nav>
    </aside>
  );
}
