import type { Metadata } from 'next';
import VerificationFlow from '@/app/instructor/(dashboard)/verification/_components/verification-flow';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Xác minh giảng viên | SkillPath' };

export default function InstructorVerificationPage() {
  return <VerificationFlow />;
}
