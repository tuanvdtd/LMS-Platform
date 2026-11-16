import type { Metadata } from 'next';
import { FileLibrary } from './_components/file-library';

export const metadata: Metadata = { title: 'Thư viện file | Aolumi' };

export default function InstructorLibraryPage() {
  return <FileLibrary />;
}
