import { listCourses } from '@/lib/api/catalog';
import type { CategoryNode } from '@/types';
import { FeaturedTabs } from './featured-tabs';

export async function GuestFeatured({ categories }: { categories: CategoryNode[] }) {
  const data = await listCourses({ sort: 'popular', page: 1, limit: 8 });
  return <FeaturedTabs initial={data?.items ?? null} categories={categories.map(({ slug, name }) => ({ slug, name }))} />;
}
