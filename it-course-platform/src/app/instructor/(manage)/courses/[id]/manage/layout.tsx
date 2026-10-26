import { Suspense } from 'react';
import { CourseManageShell } from './_components/course-manage-shell';
import { CourseProvider, ManageSkeleton } from './_components/course-provider';

// CourseProvider đọc [id] bằng useParams → suspend khi prerender tĩnh, nên cả cây
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
