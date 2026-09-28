import type { Metadata } from 'next';
import CourseBuilder from '@/app/instructor/courses/_components/course-builder';

export const metadata: Metadata = { title: 'Tạo khoá học mới | SkillPath' };

export default async function NewCoursePage({ searchParams }: PageProps<'/instructor/courses/new'>) {
  const { section } = await searchParams;
  return <CourseBuilder section={typeof section === 'string' ? section : undefined} />;
}
