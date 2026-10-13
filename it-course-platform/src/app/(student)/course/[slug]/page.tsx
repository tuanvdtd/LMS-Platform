import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CourseDetailSkeleton } from '@/components/skeletons/course-detail-skeleton';
import { getCourse, getCurriculum } from '@/lib/api/catalog';
import CourseDetailView from './_components/course-detail-view';

export async function generateMetadata({ params }: PageProps<'/course/[slug]'>): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course
    ? { title: `${course.title} | SkillPath`, description: course.subtitle ?? undefined }
    : { title: 'Không tìm thấy khoá học | SkillPath' };
}

// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function CourseDetailPage(props: PageProps<'/course/[slug]'>) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps<'/course/[slug]'>) {
  const { slug } = await params;
  const [course, sections] = await Promise.all([getCourse(slug), getCurriculum(slug)]);
  if (!course) notFound();
  return <CourseDetailView course={course} sections={sections ?? []} />;
}
