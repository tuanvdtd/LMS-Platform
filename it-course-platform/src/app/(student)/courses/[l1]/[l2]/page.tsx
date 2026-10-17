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

export async function generateMetadata({ params }: PageProps<'/courses/[l1]/[l2]'>): Promise<Metadata> {
  const [{ l1, l2 }, tree] = await Promise.all([params, getCategoryTree()]);
  const child = tree.find((c) => c.slug === l1)?.children.find((c) => c.slug === l2);
  return { title: `${child?.name ?? 'Danh mục'} | SkillPath` };
}

// Suspense ngoài: params/searchParams là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// CatalogListing tự bọc khu kết quả bằng Suspense key theo params.
export default function Page(props: PageProps<'/courses/[l1]/[l2]'>) {
  return (
    <Suspense fallback={<CatalogListingSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params, searchParams }: PageProps<'/courses/[l1]/[l2]'>) {
  const [{ l1, l2 }, sp, tree] = await Promise.all([params, searchParams, getCategoryTree()]);
  const parent = tree.find((c) => c.slug === l1);
  const child = parent?.children.find((c) => c.slug === l2);
  if (!parent || !child) notFound();
  const head = await listCourses(starterArgs({ category: l2 }));
  return (
    <CatalogListing
      base={categoryHref(l1, l2)}
      params={parseCatalogParams(sp)}
      category={l2}
      title={`Khoá học ${child.name}`}
      breadcrumb={[
        { label: parent.name, href: categoryHref(l1) },
        { label: child.name, href: categoryHref(l1, l2) },
      ]}
      stats={[
        ...(head ? [{ label: 'Khoá học', value: fmt(head.total) }] : []),
        ...(child.topics.length ? [{ label: 'Chủ đề', value: fmt(child.topics.length) }] : []),
      ]}
      nav={<CatalogSubnav parent={parent} activeChild={l2} />}
      intro={
        <>
          <Suspense fallback={<CatalogStarterSkeleton />}>
            <CatalogStarter category={l2} />
          </Suspense>
          <LinkTiles title="Chủ đề phổ biến" links={topicLinks(child.topics)} />
        </>
      }
      resultsTitle={`Tất cả khoá học ${child.name}`}
    />
  );
}
