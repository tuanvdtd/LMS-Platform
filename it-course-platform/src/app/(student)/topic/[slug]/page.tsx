import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListing } from '@/app/(student)/_components/catalog-listing';
import { CourseGridSkeleton } from '@/components/skeletons/course-grid-skeleton';
import { listCourses } from '@/lib/api/catalog';
import { topicHref } from '@/lib/category-links';
import { parseCatalogParams } from '@/types/catalog';

export async function generateMetadata({ params }: PageProps<'/topic/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const head = await listCourses({ page: 1, topic: slug, limit: 20 });
  return { title: `${head?.topic?.name ?? 'Chủ đề'} | SkillPath` };
}

// Suspense ngoài: searchParams/params là runtime data, đọc bên trong boundary để điều hướng (đổi bộ lọc) không bị chặn.
// Suspense trong (key theo params) hiện skeleton mỗi lần đổi bộ lọc.
export default function Page(props: PageProps<'/topic/[slug]'>) {
  return (
    <Suspense fallback={<CourseGridSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params, searchParams }: PageProps<'/topic/[slug]'>) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  // Lấy tên topic từ response.topic (spec §3.1); null = slug không tồn tại.
  const p = parseCatalogParams(sp);
  const head = await listCourses({ ...p, topic: slug, limit: 20 });
  if (head && !head.topic) notFound();
  return (
    <Suspense key={JSON.stringify(p)} fallback={<CourseGridSkeleton />}>
      <CatalogListing base={topicHref(slug)} params={p} topic={slug} title={head?.topic?.name ?? slug} />
    </Suspense>
  );
}
