import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { EmptyState } from '@/components/shared/product-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { listCourses } from '@/lib/api/catalog';
import { cn } from '@/lib/utils';
import { catalogHref, type CatalogParams, type CatalogSort, type SkillLevel } from '@/types/catalog';
import { SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { CatalogFilterSheet } from './catalog-filter-sheet';

const LIMIT = 20;

const SORT_LABEL: Record<CatalogSort, string> = {
  newest: 'Mới nhất',
  popular: 'Phổ biến',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
};

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

// Trang danh sách dùng chung cho /courses, /courses/[l1](/[l2]), /topic/[slug] (spec public-catalog §4.2).
// Mọi bộ lọc/sort/trang là <Link> → URL là nguồn sự thật, back/forward đúng, không cần JS.
export async function CatalogListing({
  base,
  params,
  category,
  topic,
  title,
  breadcrumb,
}: {
  base: string;
  params: CatalogParams;
  category?: string;
  topic?: string;
  title: string;
  breadcrumb?: { label: string; href: string }[];
}) {
  // Không truyền key undefined: trang topic gọi cùng args ở page → trùng cache key, chỉ 1 request.
  const data = await listCourses({ ...params, ...(category && { category }), ...(topic && { topic }), limit: LIMIT });
  const href = (patch: Partial<CatalogParams>) => catalogHref(base, params, patch);
  const pages = data ? Math.ceil(data.total / LIMIT) : 0;
  const activeCount = (params.level ? 1 : 0) + (params.price ? 1 : 0);

  const filters = (
    <div className="flex flex-col gap-6">
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
          { label: 'Miễn phí', href: href({ price: 'free' }), active: params.price === 'free' },
          { label: 'Trả phí', href: href({ price: 'paid' }), active: params.price === 'paid' },
        ]}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/courses" className={cn('rounded-sm hover:text-foreground hover:underline', focusRing)}>
                Khoá học
              </Link>
            </li>
            {breadcrumb.map((b, i) => (
              <li key={b.href} className="flex items-center gap-1">
                <ChevronRight className="size-3.5" aria-hidden />
                {i === breadcrumb.length - 1 ? (
                  <span aria-current="page" className="text-foreground">
                    {b.label}
                  </span>
                ) : (
                  <Link href={b.href} className={cn('rounded-sm hover:text-foreground hover:underline', focusRing)}>
                    {b.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <h1 className="text-2xl font-extrabold break-words text-foreground md:text-3xl">{title}</h1>
      {data && <p className="mt-1 text-sm text-muted-foreground">{data.total.toLocaleString('vi-VN')} khoá học</p>}

      <div className="mt-6 flex gap-8">
        <aside aria-label="Bộ lọc" className="hidden w-56 shrink-0 lg:block">
          {filters}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <CatalogFilterSheet activeCount={activeCount}>{filters}</CatalogFilterSheet>
            <nav aria-label="Sắp xếp" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Sắp xếp:</span>
              {(Object.keys(SORT_LABEL) as CatalogSort[]).map((s) => {
                const active = (params.sort ?? 'newest') === s;
                return (
                  <Link
                    key={s}
                    href={href({ sort: s })}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-foreground hover:bg-secondary',
                      focusRing,
                    )}
                  >
                    {SORT_LABEL[s]}
                  </Link>
                );
              })}
            </nav>
          </div>

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
            <EmptyState
              icon={SearchX}
              title="Không tìm thấy khoá học phù hợp"
              description="Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm."
              action={
                <Link
                  href={catalogHref(base, { page: 1, q: params.q }, {})}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Xoá bộ lọc
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((c) => (
                <CatalogCourseCard key={c.id} course={c} />
              ))}
            </div>
          )}

          {pages > 1 && <PageNav page={params.page} pages={pages} href={(n) => href({ page: n })} />}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, options }: { label: string; options: { label: string; href: string; active: boolean }[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-foreground">{label}</h2>
      <ul className="flex flex-col gap-0.5">
        {options.map((o) => (
          <li key={o.label}>
            <Link
              href={o.href}
              aria-current={o.active ? 'true' : undefined}
              className={cn(
                'flex min-h-10 items-center justify-between gap-2 rounded-md px-3 text-sm transition-colors',
                o.active ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                focusRing,
              )}
            >
              {o.label}
              {o.active && <Check className="size-4 text-primary" aria-hidden />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

function PageNav({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  // children: [icon, label] hoặc [label, icon] tuỳ phía.
  const edge = (n: number, disabled: boolean, children: React.ReactNode) =>
    disabled ? (
      <span aria-disabled="true" className={cn(buttonVariants({ variant: 'ghost' }), 'opacity-50')}>
        {children}
      </span>
    ) : (
      <Link href={href(n)} className={buttonVariants({ variant: 'ghost' })}>
        {children}
      </Link>
    );
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1">
      {edge(page - 1, page <= 1, <><ChevronLeft data-icon="inline-start" aria-hidden />Trước</>)}
      <span className="px-2 text-sm tabular-nums sm:hidden">
        {page} / {pages}
      </span>
      <span className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pages).map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="w-9 text-center text-sm text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              aria-label={`Trang ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={buttonVariants({ variant: n === page ? 'secondary' : 'ghost', size: 'icon' })}
            >
              {n}
            </Link>
          ),
        )}
      </span>
      {edge(page + 1, page >= pages, <>Sau<ChevronRight data-icon="inline-end" aria-hidden /></>)}
    </nav>
  );
}
