'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tab "Phổ biến nhất / Mới nhất" + hàng card cuộn ngang (scroll-snap). Card render ở server, truyền vào qua `items`.
export function CatalogStarterTabs({ tabs }: { tabs: { value: string; label: string; items: React.ReactNode[] }[] }) {
  return (
    <Tabs defaultValue={tabs[0]?.value}>
      <TabsList variant="line" className="h-auto w-full justify-start gap-4 border-b">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="min-h-11 flex-none px-1 text-base">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className="pt-4">
          <CourseCarousel items={t.items} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CourseCarousel({ items }: { items: React.ReactNode[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: 'smooth' });
  const arrow = 'absolute top-1/3 z-10 hidden -translate-y-1/2 rounded-full shadow-md md:inline-flex';

  return (
    <div className="relative">
      <ul
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] motion-reduce:scroll-auto md:mx-0 md:scroll-px-0 md:px-0"
      >
        {items.map((item, i) => (
          <li key={i} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]">
            {item}
          </li>
        ))}
      </ul>
      {items.length > 2 && (
        <>
          <Button variant="outline" size="icon" aria-label="Xem khoá trước" onClick={() => scroll(-1)} className={cn(arrow, '-left-4')}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Xem khoá tiếp theo" onClick={() => scroll(1)} className={cn(arrow, '-right-4')}>
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
}
