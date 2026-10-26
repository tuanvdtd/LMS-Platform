import { Suspense } from 'react';
import InstructorHeader from '@/components/layout/instructor-header';
import InstructorSidebar from '@/components/layout/instructor-sidebar';

// Header giảng viên + sidebar (desktop) cho các trang dashboard giảng viên; mobile dùng drawer trong header. Trang quản lý khoá ((manage)) toàn màn hình, không dùng layout này.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstructorHeader />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* usePathname() cần Suspense khi route có [id] được prerender tĩnh; fallback giữ đúng bề rộng sidebar */}
        <Suspense fallback={<aside className="hidden w-[220px] shrink-0 border-r bg-card lg:block" />}>
          <InstructorSidebar />
        </Suspense>
        {children}
      </div>
    </>
  );
}
