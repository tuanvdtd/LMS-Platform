import type { Metadata } from 'next';
import { OverviewView } from './_components/overview-view';

export const metadata: Metadata = { title: 'Tổng quan giảng viên | Aolumi' };

export default function InstructorDashboardPage() {
  return <OverviewView />;
}
