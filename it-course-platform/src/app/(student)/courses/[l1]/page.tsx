import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import {
  CatalogStarter,
  CatalogStarterSkeleton,
  CatalogSubnav,
  LinkTiles,
  starterArgs,
  topicLinks,
} from '@/app/(student)/_components/catalog-sections';
import { CatalogListingSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { listCourses } from '@/lib/api/catalog';
import { getCategoryTree } from '@/lib/api/categories';
import { categoryHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

const fmt = (n: number) => n.toLocaleString('vi-VN');

export async function generateMetadata({ params }: PageProps<'/courses/[l1]'>): Promise<Metadata> {
  const [{ l1 }, tree] = await Promise.all([params, getCategoryTree()]);
  return { title: `${tree.find((c) => c.slug === l1)?.name ?? 'Danh mục'} | SkillPath` };
}

// Suspense ngoài: params/searchParams là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// CatalogListing tự bọc khu kết quả bằng Suspense key theo params.
export default function Page(props: PageProps<'/courses/[l1]'>) {
  return (
    <Suspense fallback={<CatalogListingSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params, searchParams }: PageProps<'/courses/[l1]'>) {
  const [{ l1 }, sp, tree] = await Promise.all([params, searchParams, getCategoryTree()]);
  const parent = tree.find((c) => c.slug === l1);
  if (!parent) notFound();
  const head = await listCourses(starterArgs({ category: l1 }));
  const topics = parent.children.flatMap((c) => c.topics);
  return (
    <CatalogListing
      base={categoryHref(l1)}
      params={parseCatalogParams(sp)}
      category={l1}
      title={`Khoá học ${parent.name}`}
      breadcrumb={[{ label: parent.name, href: categoryHref(l1) }]}
      stats={[
        ...(head ? [{ label: 'Khoá học', value: fmt(head.total) }] : []),
        { label: 'Danh mục con', value: fmt(parent.children.length) },
        ...(topics.length ? [{ label: 'Chủ đề', value: fmt(topics.length) }] : []),
      ]}
      nav={<CatalogSubnav parent={parent} />}
      intro={
        <>
          <Suspense fallback={<CatalogStarterSkeleton />}>
            <CatalogStarter category={l1} />
          </Suspense>
          <LinkTiles title="Chủ đề phổ biến" links={topicLinks(topics)} />
        </>
      }
      resultsTitle={`Tất cả khoá học ${parent.name}`}
    />
  );
}
