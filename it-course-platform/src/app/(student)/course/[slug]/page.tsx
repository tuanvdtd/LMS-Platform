import type { Metadata } from 'next';
import CourseDetailView from './_components/course-detail-view';

export const metadata: Metadata = { title: 'Chi tiết khoá học | SkillPath' };

export default async function CourseDetailPage({ params }: PageProps<'/course/[slug]'>) {
  const { slug } = await params;
  return <CourseDetailView slug={slug} />;
}
