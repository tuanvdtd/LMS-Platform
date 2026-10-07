import type { Metadata } from 'next';
import { RevenueShareForm } from './_components/revenue-share-form';

// Gate client ở admin/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Cài đặt | SkillPath Admin' };

export default function AdminSettingsPage() {
  return <RevenueShareForm />;
}
