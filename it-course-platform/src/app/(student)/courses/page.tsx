import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import {
  CatalogStarter,
  CatalogStarterSkeleton,
  LinkTiles,
  starterArgs,
} from '@/app/(student)/_components/catalog-sections';
import { CatalogListingSkeleton } from '@/components/skeletons/catalog-listing-skeleton';
import { listCourses } from '@/lib/api/catalog';
import { getCategoryTree } from '@/lib/api/categories';
import { categoryHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

export const metadata: Metadata = { title: 'Khám phá khoá học | SkillPath' };

const fmt = (n: number) => n.toLocaleString('vi-VN');

// Suspense ngoài: searchParams là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// CatalogListing tự bọc khu kết quả bằng Suspense key theo params.
export default function Page(props: PageProps<'/courses'>) {
  return (
    <Suspense fallback={<CatalogListingSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ searchParams }: PageProps<'/courses'>) {
  const params = parseCatalogParams(await searchParams);
  if (params.q) {
    return (
      <CatalogListing
        base="/courses"
        params={params}
        title={`Kết quả cho “${params.q}”`}
        description="Các khoá học khớp với từ khoá của bạn. Lọc theo trình độ, giá hoặc đổi cách sắp xếp bên dưới."
        resultsTitle="Khoá học phù hợp"
      />
    );
  }

  const [tree, head] = await Promise.all([getCategoryTree(), listCourses(starterArgs())]);
  const topicCount = tree.reduce((n, c) => n + c.children.reduce((m, s) => m + s.topics.length, 0), 0);
  return (
    <CatalogListing
      base="/courses"
      params={params}
      title="Khám phá khoá học"
      description="Lộ trình học thực chiến về lập trình, dữ liệu và công nghệ — chọn khoá học phù hợp với trình độ và mục tiêu của bạn."
      stats={[
        ...(head ? [{ label: 'Khoá học', value: fmt(head.total) }] : []),
        ...(tree.length ? [{ label: 'Danh mục', value: fmt(tree.length) }] : []),
        ...(topicCount ? [{ label: 'Chủ đề', value: fmt(topicCount) }] : []),
      ]}
      intro={
        <>
          <Suspense fallback={<CatalogStarterSkeleton />}>
            <CatalogStarter />
          </Suspense>
          <LinkTiles
            title="Duyệt theo danh mục"
            links={tree.map((c) => ({
              id: c.id,
              name: c.name,
              href: categoryHref(c.slug),
              meta: `${c.children.length} danh mục con`,
            }))}
          />
        </>
      }
      resultsTitle="Tất cả khoá học"
    />
  );
}
