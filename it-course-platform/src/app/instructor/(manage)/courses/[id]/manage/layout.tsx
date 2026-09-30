import { Suspense } from 'react';
import { CourseManageShell } from './_components/course-manage-shell';
import { CourseProvider, ManageSkeleton } from './_components/course-provider';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

// CourseProvider đọc [id] bằng useParams → suspend khi prerender (cacheComponents), nên cả cây
// client (provider, thanh trên, ChecklistSidebar) nằm trong Suspense.
export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ManageSkeleton />}>
      <CourseProvider>
        <CourseManageShell>{children}</CourseManageShell>
      </CourseProvider>
    </Suspense>
  );
}
