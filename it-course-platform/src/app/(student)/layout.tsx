import SiteHeader from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCategoryTree } from "@/lib/api/categories";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // API sập thì footer thiếu cột danh mục, trang vẫn hiện. fetch cache 60s, dùng chung với header.
  const categories = await getCategoryTree().catch(() => []);
  // Footer luôn ở đáy màn: main giãn hết chỗ trống (trang rỗng / 404 không kéo footer lên giữa màn).
  // Dùng flex chứ không grid: header sticky cần khối chứa là cả trang, ô grid chỉ cao bằng header.
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} />
    </div>
  );
}
