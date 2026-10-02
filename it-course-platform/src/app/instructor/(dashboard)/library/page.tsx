import type { Metadata } from 'next';
import { FileLibrary } from './_components/file-library';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Thư viện file | SkillPath' };

export default function InstructorLibraryPage() {
  return <FileLibrary />;
}
