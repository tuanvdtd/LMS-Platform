import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import { CatalogListingSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { getCategoryTree } from '@/lib/api/categories';
import { categoryHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

export async function generateMetadata({ params }: PageProps<'/courses/[l1]/[l2]'>): Promise<Metadata> {
  const [{ l1, l2 }, tree] = await Promise.all([params, getCategoryTree()]);
  const child = tree.find((c) => c.slug === l1)?.children.find((c) => c.slug === l2);
  return { title: `${child?.name ?? 'Danh mục'} | SkillPath` };
}

// Suspense ngoài: searchParams/params là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// Suspense trong (key theo params) hiện skeleton mỗi lần đổi bộ lọc.
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
  const p = parseCatalogParams(sp);
  return (
    <Suspense key={JSON.stringify(p)} fallback={<CatalogListingSkeleton />}>
      <CatalogListing
        base={categoryHref(l1, l2)}
        params={p}
        category={l2}
        title={child.name}
        breadcrumb={[
          { label: parent.name, href: categoryHref(l1) },
          { label: child.name, href: categoryHref(l1, l2) },
        ]}
      />
    </Suspense>
  );
}
