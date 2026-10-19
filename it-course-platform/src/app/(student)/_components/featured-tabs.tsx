'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, RotateCw, WifiOff } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listPopularCourses } from '@/lib/api/catalog-client';
import type { CourseCard } from '@/types/catalog';

const ALL = 'all';
type TabState = CourseCard[] | 'loading' | 'error';

// Khối 4 trang chủ khách. Tab "Tất cả" có sẵn từ server; tab danh mục tải khi bấm, nhớ kết quả.
export function FeaturedTabs({ initial, categories }: { initial: CourseCard[] | null; categories: { slug: string; name: string }[] }) {
  const [tab, setTab] = useState(ALL);
  const [byTab, setByTab] = useState<Record<string, TabState>>({ [ALL]: initial ?? 'error' });

  function load(slug: string) {
    setByTab((m) => ({ ...m, [slug]: 'loading' }));
    listPopularCourses(slug).then(
      (d) => setByTab((m) => ({ ...m, [slug]: d.items })),
      () => setByTab((m) => ({ ...m, [slug]: 'error' })),
    );
  }

  function select(value: string) {
    setTab(value);
    if (!byTab[value]) load(value);
  }

  const state = byTab[tab] ?? 'loading';

  return (
    <section aria-labelledby="guest-featured" className="bg-background">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="guest-featured" className="text-2xl font-bold text-foreground md:text-3xl">Khoá học nổi bật</h2>
            <p className="mt-2 text-secondary-foreground">Khoá được học viên ghi danh nhiều nhất.</p>
          </div>
          <Link href="/courses?sort=popular" className="flex min-h-6 shrink-0 items-center gap-1 py-1 text-sm font-medium text-primary hover:underline">
            Xem tất cả <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <Tabs value={tab} onValueChange={(v) => select(String(v))}>
          {/* pb-1.5: gạch chân tab line nằm -5px dưới list; thiếu chỗ thì khung overflow-x-auto hiện thanh cuộn dọc */}
          <div className="-mx-4 mb-2.5 overflow-x-auto overflow-y-hidden px-4 pb-1.5">
            <TabsList variant="line">
              <TabsTrigger value={ALL}>Tất cả</TabsTrigger>
              {categories.map((c) => <TabsTrigger key={c.slug} value={c.slug}>{c.name}</TabsTrigger>)}
            </TabsList>
          </div>

          {/* Một panel cho tab đang chọn → aria-controls của tab trỏ đúng vùng lưới. mb-2.5 + gap-2 của Tabs = 18px như wireframe. */}
          <TabsContent value={tab} className="text-base">
            {state === 'loading' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-busy="true" aria-label="Đang tải">
                {Array.from({ length: 4 }, (_, i) => <CourseCardSkeleton key={i} />)}
              </div>
            ) : state === 'error' ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-secondary"><WifiOff className="size-5 text-muted-foreground" aria-hidden /></span>
                <p className="font-semibold">Không tải được khoá học</p>
                <p className="max-w-sm text-sm text-muted-foreground">Kết nối tới máy chủ gặp sự cố. Thử lại sau ít phút.</p>
                {tab === ALL ? (
                  <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>Xem tất cả khoá học</Link>
                ) : (
                  <Button variant="outline" onClick={() => load(tab)}><RotateCw data-icon="inline-start" />Thử lại</Button>
                )}
              </div>
            ) : state.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-secondary"><BookOpen className="size-5 text-muted-foreground" aria-hidden /></span>
                <p className="font-semibold">Chưa có khoá nổi bật</p>
                <p className="max-w-sm text-sm text-muted-foreground">Các khoá mới đang chờ kiểm duyệt. Bạn vẫn có thể xem toàn bộ danh mục.</p>
                <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>Xem tất cả khoá học</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.map((c) => <CatalogCourseCard key={c.id} course={c} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
