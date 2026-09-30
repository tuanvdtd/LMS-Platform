import Header from '@/components/layout/header';
import { getCategoryTree } from '@/lib/api/categories';

// Server wrapper: lấy cây danh mục (cache) rồi truyền cho Header client.
export default async function SiteHeader({ cartCount }: { cartCount?: number }) {
  return <Header cartCount={cartCount} categories={await getCategoryTree()} />;
}
