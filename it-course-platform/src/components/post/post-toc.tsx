'use client';

import { useEffect, useState } from 'react';
import type { PostHeading } from '@/lib/post-html';
import { cn } from '@/lib/utils';

// Mục lục dính bên phải: link neo thường (chạy cả khi chưa có JS); JS chỉ thêm việc tô mục đang đọc.
export function PostToc({ headings, className }: { headings: PostHeading[]; className?: string }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const els = headings.flatMap((h) => document.getElementById(h.id) ?? []);
    // Mục "đang đọc" = tiêu đề cuối cùng đã cuộn qua mép trên (header dính 4rem + khoảng thở; khớp scroll-margin-top 7rem
    // của .post-body h2 để bấm link mục lục thì mục đó sáng ngay).
    // Nghe scroll thay vì IntersectionObserver: nhảy xa một lần (End, bấm link mục lục) không đi ngang qua tiêu đề nào
    // nên observer không báo, mục lục đứng yên ở mục cũ.
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = els.filter((el) => el.getBoundingClientRect().top <= 120);
      setActive((passed.at(-1) ?? els[0])?.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;
  return (
    <nav aria-label="Mục lục" className={cn('text-sm', className)}>
      <p className="mb-3 font-semibold text-foreground">Trong bài này</p>
      <ul className="flex flex-col border-l">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l py-1.5 pr-2 leading-snug outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline',
                h.level === 3 ? 'pl-7' : 'pl-4',
                active === h.id ? 'border-foreground font-semibold text-foreground' : 'border-transparent text-muted-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
