import type { Metadata } from 'next';
import { GoalsForm } from '../_components/goals-form';

export const metadata: Metadata = { title: 'Học viên mục tiêu | SkillPath' };

export default function GoalsPage() {
  return <GoalsForm />;
}
