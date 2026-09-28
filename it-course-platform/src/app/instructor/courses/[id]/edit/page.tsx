import type { Metadata } from 'next';
import CourseBuilder from '@/app/instructor/courses/_components/course-builder';

export const metadata: Metadata = { title: 'Chỉnh sửa khoá học | SkillPath' };

export default async function EditCoursePage({ params, searchParams }: PageProps<'/instructor/courses/[id]/edit'>) {
  const [{ id }, { section }] = await Promise.all([params, searchParams]);
  return <CourseBuilder id={id} section={typeof section === 'string' ? section : undefined} />;
}
