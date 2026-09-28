import type { Metadata } from 'next';
import SearchView from '@/app/(student)/_components/search-view';

export const metadata: Metadata = { title: 'Tìm kiếm | SkillPath' };

export default async function Page({ searchParams }: PageProps<'/search'>) {
  const { q } = await searchParams;
  return <SearchView query={typeof q === 'string' ? q : ''} />;
}
