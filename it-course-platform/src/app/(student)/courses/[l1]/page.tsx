import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import { CatalogListingSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { getCategoryTree } from '@/lib/api/categories';
import { categoryHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

export async function generateMetadata({ params }: PageProps<'/courses/[l1]'>): Promise<Metadata> {
  const [{ l1 }, tree] = await Promise.all([params, getCategoryTree()]);
  return { title: `${tree.find((c) => c.slug === l1)?.name ?? 'Danh mục'} | SkillPath` };
}

// Suspense ngoài: searchParams/params là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// Suspense trong (key theo params) hiện skeleton mỗi lần đổi bộ lọc.
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
  const p = parseCatalogParams(sp);
  return (
    <Suspense key={JSON.stringify(p)} fallback={<CatalogListingSkeleton />}>
      <CatalogListing
        base={categoryHref(l1)}
        params={p}
        category={l1}
        title={parent.name}
        breadcrumb={[{ label: parent.name, href: categoryHref(l1) }]}
      />
    </Suspense>
  );
}
