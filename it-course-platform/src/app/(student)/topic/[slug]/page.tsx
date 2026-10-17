import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import {
  CatalogStarter,
  CatalogStarterSkeleton,
  RelatedTopics,
  starterArgs,
} from '@/app/(student)/_components/catalog-sections';
import { CatalogListingSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { listCourses } from '@/lib/api/catalog';
import { getCategoryTree } from '@/lib/api/categories';
import { categoryHref, topicHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

export async function generateMetadata({ params }: PageProps<'/topic/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const head = await listCourses({ page: 1, topic: slug, limit: 20 });
  return { title: `${head?.topic?.name ?? 'Chủ đề'} | SkillPath` };
}

// Suspense ngoài: params/searchParams là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// CatalogListing tự bọc khu kết quả bằng Suspense key theo params.
export default function Page(props: PageProps<'/topic/[slug]'>) {
  return (
    <Suspense fallback={<CatalogListingSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params, searchParams }: PageProps<'/topic/[slug]'>) {
  const [{ slug }, sp, tree] = await Promise.all([params, searchParams, getCategoryTree()]);
  // Lấy tên topic từ response.topic (spec §3.1); null = slug không tồn tại.
  const p = parseCatalogParams(sp);
  const head = await listCourses({ ...p, topic: slug, limit: 20 });
  if (head && !head.topic) notFound();
  const name = head?.topic?.name ?? slug;
  const all = await listCourses(starterArgs({ topic: slug }));

  // Vị trí topic trong cây danh mục → breadcrumb đầy đủ + chủ đề liên quan (cùng danh mục con).
  const parent = tree.find((c) => c.children.some((s) => s.topics.some((t) => t.slug === slug)));
  const sub = parent?.children.find((s) => s.topics.some((t) => t.slug === slug));

  return (
    <CatalogListing
      base={topicHref(slug)}
      params={p}
      topic={slug}
      title={`Khoá học ${name}`}
      stats={all ? [{ label: 'Khoá học', value: all.total.toLocaleString('vi-VN') }] : undefined}
      breadcrumb={[
        ...(parent && sub
          ? [
              { label: parent.name, href: categoryHref(parent.slug) },
              { label: sub.name, href: categoryHref(parent.slug, sub.slug) },
            ]
          : []),
        { label: name, href: topicHref(slug) },
      ]}
      headerExtra={<RelatedTopics topics={sub?.topics.filter((t) => t.slug !== slug) ?? []} />}
      intro={
        <Suspense fallback={<CatalogStarterSkeleton />}>
          <CatalogStarter topic={slug} />
        </Suspense>
      }
      resultsTitle={`Tất cả khoá học ${name}`}
    />
  );
}
