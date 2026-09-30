import type { Metadata } from 'next';
import { GoalsForm } from '../_components/goals-form';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Học viên mục tiêu | SkillPath' };

export default function GoalsPage() {
  return <GoalsForm />;
}
