import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourse, getCurriculum } from '@/lib/api/catalog';
import CourseDetailView from './_components/course-detail-view';

export async function generateMetadata({ params }: PageProps<'/course/[slug]'>): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course
    ? { title: `${course.title} | SkillPath`, description: course.subtitle ?? undefined }
    : { title: 'Không tìm thấy khoá học | SkillPath' };
}

export default async function CourseDetailPage({ params }: PageProps<'/course/[slug]'>) {
  const { slug } = await params;
  const [course, sections] = await Promise.all([getCourse(slug), getCurriculum(slug)]);
  if (!course) notFound();
  return <CourseDetailView course={course} sections={sections ?? []} />;
}
