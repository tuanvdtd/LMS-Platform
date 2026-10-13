import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { listCourses } from '@/lib/api/catalog';

// Khối "Khoá nổi bật" (spec public-catalog §4.1). Bỏ tab track (track đã bỏ khỏi domain).
export default async function FeaturedCourses() {
  const data = await listCourses({ sort: 'popular', page: 1, limit: 8 });
  if (!data?.items.length) return null;
  return (
    <section aria-labelledby="featured-courses-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="featured-courses-heading" className="text-xl font-bold text-foreground">
          Khoá học nổi bật
        </h2>
        <Link
          href="/courses?sort=popular"
          className="flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Xem tất cả <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.items.map((c) => (
          <CatalogCourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
