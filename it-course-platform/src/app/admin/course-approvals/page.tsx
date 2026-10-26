import type { Metadata } from 'next';
import { ApprovalsView } from './_components/approvals-view';

export const metadata: Metadata = { title: 'Duyệt khoá học | SkillPath Admin' };

export default function AdminCourseApprovalsPage() {
  return <ApprovalsView />;
}
