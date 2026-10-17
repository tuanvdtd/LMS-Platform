import { Suspense } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronRight, SearchX, X } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { EmptyState } from '@/components/shared/product-ui';
import { CatalogResultsSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { listCourses } from '@/lib/api/catalog';
import { cn } from '@/lib/utils';
import { catalogHref, type CatalogParams, type CatalogSort, type SkillLevel } from '@/types/catalog';
import { SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { CatalogFilterSheet } from './catalog-filter-sheet';
import { SectionHeading } from './catalog-sections';
import { CatalogSortMenu } from './catalog-sort-menu';

const LIMIT = 20;
const RESULTS_ID = 'tat-ca-khoa-hoc';

const SORT_LABEL: Record<CatalogSort, string> = {
  newest: 'Mới nhất',
  popular: 'Phổ biến',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
};

const PRICE_LABEL = { free: 'Miễn phí', paid: 'Trả phí' } as const;

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';
const crumbLink = cn('rounded-sm transition-colors hover:text-foreground', focusRing);

type Scope = { base: string; params: CatalogParams; category?: string; topic?: string };

// Khung trang danh sách dùng chung cho /courses (tìm kiếm), /courses/[l1](/[l2]), /topic/[slug] (spec public-catalog §4.2).
// Bố cục tham khảo Udemy: [nav danh mục con] → hero → [intro: khoá để bắt đầu, chủ đề] → "Tất cả khoá học".
// Mỗi section là một dải nền riêng (trắng / xám) để tách biệt rõ. Tìm kiếm dùng ô search trên header site.
// Chỉ khu kết quả nằm trong Suspense key theo params → đổi lọc/sort/trang chỉ tải lại khu này.
export function CatalogListing({
  base,
  params,
  category,
  topic,
  title,
  description,
  breadcrumb,
  stats,
  nav,
  headerExtra,
  intro,
  resultsTitle,
}: Scope & {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href: string }[];
  stats?: { label: string; value: string }[];
  nav?: React.ReactNode;
  headerExtra?: React.ReactNode;
  intro?: React.ReactNode;
  resultsTitle: string;
}) {
  // Ô số liệu bằng 0 ("Khoá học 0") không nói gì, chỉ làm trang trông trống hơn.
  const shownStats = stats?.filter((s) => s.value !== '0');
  return (
    <>
      {nav}
      <section className="relative isolate overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-brand-accent/10">
        {/* Hoạ tiết chấm + quầng sáng: trang trí, mờ dần xuống dưới. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [mask-image:linear-gradient(to_bottom,black,transparent)] bg-size-[22px_22px]"
        />
        <div aria-hidden className="absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 left-1/3 -z-10 size-80 rounded-full bg-brand-accent/10 blur-3xl" />

        <div className="mx-auto max-w-screen-xl px-4 py-10 md:py-14">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className={crumbLink}>
                  Trang chủ
                </Link>
              </li>
              {[{ label: 'Khoá học', href: '/courses' }, ...(breadcrumb ?? [])].map((b, i, all) => (
                <li key={b.href} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5" aria-hidden />
                  {i === all.length - 1 ? (
                    <span aria-current="page" className="font-medium text-foreground">
                      {b.label}
                    </span>
                  ) : (
                    <Link href={b.href} className={crumbLink}>
                      {b.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight break-words text-balance text-foreground md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">{description}</p>
          )}

          {shownStats && shownStats.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-3">
              {shownStats.map((s) => (
                <div key={s.label} className="min-w-32 rounded-xl border bg-card/80 px-4 py-3 shadow-xs backdrop-blur">
                  <dt className="text-xs font-medium text-muted-foreground">{s.label}</dt>
                  <dd className="mt-0.5 text-2xl font-extrabold text-foreground tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {headerExtra}
        </div>
      </section>

      {intro}

      <section id={RESULTS_ID} className="scroll-mt-20 bg-background py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4">
          <SectionHeading title={resultsTitle} />
          <Suspense key={JSON.stringify(params)} fallback={<CatalogResultsSkeleton />}>
            <CatalogResults base={base} params={params} category={category} topic={topic} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function CatalogResults({ base, params, category, topic }: Scope) {
  // Không truyền key undefined: trang topic gọi cùng args ở page → trùng cache key, chỉ 1 request.
  const data = await listCourses({ ...params, ...(category && { category }), ...(topic && { topic }), limit: LIMIT });
  // Gắn #tat-ca-khoa-hoc: đổi lọc/sort/trang thì cuộn về đầu khu kết quả thay vì đầu trang.
  const href = (patch: Partial<CatalogParams>) => `${catalogHref(base, params, patch)}#${RESULTS_ID}`;
  const pages = data ? Math.ceil(data.total / LIMIT) : 0;
  const activeCount = (params.level ? 1 : 0) + (params.price ? 1 : 0);
  // Xoá bộ lọc: giữ từ khoá + sắp xếp.
  const clearHref = href({ level: undefined, price: undefined });

  const chips = [
    params.q && { label: `“${params.q}”`, remove: 'từ khoá', href: href({ q: undefined }) },
    params.level && { label: SKILL_LEVEL_LABEL[params.level], remove: 'trình độ', href: href({ level: undefined }) },
    params.price && { label: PRICE_LABEL[params.price], remove: 'giá', href: href({ price: undefined }) },
  ].filter((c) => !!c);

  const filters = (
    <div className="flex flex-col">
      <FilterGroup
        label="Trình độ"
        options={[
          { label: 'Tất cả', href: href({ level: undefined }), active: !params.level },
          ...(Object.keys(SKILL_LEVEL_LABEL) as SkillLevel[]).map((l) => ({
            label: SKILL_LEVEL_LABEL[l],
            href: href({ level: l }),
            active: params.level === l,
          })),
        ]}
      />
      <FilterGroup
        label="Giá"
        options={[
          { label: 'Tất cả', href: href({ price: undefined }), active: !params.price },
          { label: PRICE_LABEL.free, href: href({ price: 'free' }), active: params.price === 'free' },
          { label: PRICE_LABEL.paid, href: href({ price: 'paid' }), active: params.price === 'paid' },
        ]}
      />
    </div>
  );

  // Mục chưa có khoá nào (không lọc mà vẫn 0): lọc / sắp xếp vô nghĩa → chỉ còn ô báo rỗng.
  const showControls = !data || data.total > 0 || activeCount > 0;

  return (
    <>
      {showControls && (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CatalogFilterSheet activeCount={activeCount} clearHref={clearHref}>
            {filters}
          </CatalogFilterSheet>
          {data && (
            <p className="order-last w-full text-sm text-muted-foreground lg:order-none lg:w-auto">
              <span className="font-semibold text-foreground tabular-nums">{data.total.toLocaleString('vi-VN')}</span> kết quả
            </p>
          )}
          <div className="ml-auto">
            <CatalogSortMenu
              options={(Object.keys(SORT_LABEL) as CatalogSort[]).map((s) => ({
                label: SORT_LABEL[s],
                href: href({ sort: s }),
                active: (params.sort ?? 'newest') === s,
              }))}
            />
          </div>
        </div>

        {chips.length > 0 && (
          <ul aria-label="Bộ lọc đang áp dụng" className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <li key={c.remove}>
                <Link
                  href={c.href}
                  aria-label={`Bỏ lọc ${c.remove}: ${c.label}`}
                  className={cn(
                    'inline-flex min-h-9 max-w-64 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 pr-2 pl-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10',
                    focusRing,
                  )}
                >
                  <span className="truncate">{c.label}</span>
                  <X className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
            {/* Ô báo rỗng đã có nút xoá riêng → chỉ hiện ở đây khi còn kết quả. */}
            {activeCount > 0 && data && data.items.length > 0 && (
              <li>
                <Link href={clearHref} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Xoá bộ lọc
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
      )}

      <div className={cn('flex gap-8', showControls && 'mt-6')}>
        {showControls && (
          <aside
            aria-label="Bộ lọc"
            className="hidden w-64 shrink-0 self-start rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-24 lg:block"
          >
            {filters}
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {!data ? (
            <Alert variant="destructive">
              <AlertTitle>Không tải được danh sách khoá học</AlertTitle>
              <AlertDescription>
                <Link href={href({})} className={cn('rounded-sm font-medium underline', focusRing)}>
                  Thử lại
                </Link>
              </AlertDescription>
            </Alert>
          ) : data.items.length === 0 ? (
            activeCount > 0 ? (
              <EmptyState
                icon={SearchX}
                title="Không tìm thấy khoá học phù hợp"
                description="Thử bỏ bớt bộ lọc để xem thêm khoá học."
                action={
                  <Link href={clearHref} className={buttonVariants({ variant: 'outline' })}>
                    Xoá bộ lọc
                  </Link>
                }
              />
            ) : params.q ? (
              <EmptyState
                icon={SearchX}
                title={`Không tìm thấy khoá học cho “${params.q}”`}
                description="Thử từ khoá khác hoặc ngắn hơn."
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Chưa có khoá học nào"
                description="Khoá học trong mục này sẽ sớm được cập nhật."
              />
            )
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.items.map((c) => (
                <li key={c.id}>
                  <CatalogCourseCard course={c} />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && <PageNav page={params.page} pages={pages} href={(n) => href({ page: n })} />}
        </div>
      </div>
    </>
  );
}

// Nhóm lọc thu gọn được bằng <details> gốc: không cần JS, mặc định mở.
function FilterGroup({ label, options }: { label: string; options: { label: string; href: string; active: boolean }[] }) {
  return (
    <details open className="group/filter border-t py-4 first:border-t-0 first:pt-0">
      <summary
        className={cn(
          'flex min-h-10 cursor-pointer list-none items-center justify-between rounded-md text-base font-bold text-foreground [&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        {label}
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform duration-200 group-open/filter:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <ul className="mt-2 flex flex-col gap-0.5">
        {options.map((o) => (
          <li key={o.label}>
            <Link
              href={o.href}
              aria-current={o.active ? 'true' : undefined}
              className={cn(
                'group/opt flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm transition-colors',
                o.active ? 'font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                focusRing,
              )}
            >
              {/* Chấm kiểu radio: trạng thái chọn không chỉ dựa vào màu chữ. */}
              <span
                aria-hidden
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  o.active ? 'border-primary' : 'border-input group-hover/opt:border-muted-foreground',
                )}
              >
                {o.active && <span className="size-1.5 rounded-full bg-primary" />}
              </span>
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

// Phân trang shadcn (ui/pagination): mỗi trang là <Link> → URL là nguồn sự thật, giữ bộ lọc + sắp xếp.
function PageNav({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  // Đầu/cuối: vẫn render để thanh không nhảy, nhưng khoá tương tác.
  const edge = (disabled: boolean) =>
    disabled ? { 'aria-disabled': true, tabIndex: -1, className: 'pointer-events-none opacity-50' } : {};
  return (
    <Pagination className="border-t pt-8">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationPrevious href={href(Math.max(1, page - 1))} {...edge(page <= 1)} />
        </PaginationItem>
        <PaginationItem className="px-2 text-sm tabular-nums sm:hidden">
          {page} / {pages}
        </PaginationItem>
        {pageWindow(page, pages).map((n, i) => (
          <PaginationItem key={n === '…' ? `gap-${i}` : n} className="hidden sm:block">
            {n === '…' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(n)} isActive={n === page} aria-label={`Trang ${n}`}>
                {n}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={href(Math.min(pages, page + 1))} {...edge(page >= pages)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
