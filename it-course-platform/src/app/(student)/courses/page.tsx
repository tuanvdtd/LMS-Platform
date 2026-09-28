import type { Metadata } from 'next';
import SearchView from '@/app/(student)/_components/search-view';

export const metadata: Metadata = { title: 'Tất cả khoá học | SkillPath' };

export default async function Page({ searchParams }: PageProps<'/courses'>) {
  const { q } = await searchParams;
  return <SearchView query={typeof q === 'string' ? q : ''} />;
}
