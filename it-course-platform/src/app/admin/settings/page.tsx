import type { Metadata } from 'next';
import { RevenueShareForm } from './_components/revenue-share-form';

export const metadata: Metadata = { title: 'Cài đặt | SkillPath Admin' };

export default function AdminSettingsPage() {
  return <RevenueShareForm />;
}
