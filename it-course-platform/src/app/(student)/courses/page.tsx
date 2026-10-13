import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import { CourseGridSkeleton } from '@/components/skeletons/course-grid-skeleton';
import { parseCatalogParams } from '@/types/catalog';

export const metadata: Metadata = { title: 'Tất cả khoá học | SkillPath' };

// Suspense ngoài: searchParams/params là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// Suspense trong (key theo params) hiện skeleton mỗi lần đổi bộ lọc.
export default function Page(props: PageProps<'/courses'>) {
  return (
    <Suspense fallback={<CourseGridSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ searchParams }: PageProps<'/courses'>) {
  const params = parseCatalogParams(await searchParams);
  return (
    <Suspense key={JSON.stringify(params)} fallback={<CourseGridSkeleton />}>
      <CatalogListing
        base="/courses"
        params={params}
        title={params.q ? `Kết quả cho “${params.q}”` : 'Tất cả khoá học'}
      />
    </Suspense>
  );
}
