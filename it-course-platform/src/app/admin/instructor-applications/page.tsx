import type { Metadata } from 'next';
import { ApplicationsView } from './_components/applications-view';

export const metadata: Metadata = { title: 'Duyệt giảng viên | SkillPath Admin' };

export default function AdminInstructorApplicationsPage() {
  return <ApplicationsView />;
}
