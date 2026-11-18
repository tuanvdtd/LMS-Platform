import SiteHeader from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCategoryTree } from "@/lib/api/categories";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // API sập thì footer thiếu cột danh mục, trang vẫn hiện. fetch cache 60s, dùng chung với header.
  const categories = await getCategoryTree().catch(() => []);
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter categories={categories} />
    </>
  );
}
