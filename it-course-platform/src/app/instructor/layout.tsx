import { Suspense } from "react";
import SiteHeader from "@/components/layout/site-header";
import InstructorSidebar from "@/components/layout/instructor-sidebar";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader cartCount={2} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* usePathname() treo khi prerender route có [id] (cacheComponents) → cần Suspense; fallback giữ đúng bề rộng sidebar */}
        <Suspense fallback={<aside className="w-[220px] shrink-0 border-r bg-card" />}>
          <InstructorSidebar />
        </Suspense>
        {children}
      </div>
    </>
  );
}
