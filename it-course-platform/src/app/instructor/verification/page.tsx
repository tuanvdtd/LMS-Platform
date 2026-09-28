import type { Metadata } from 'next';
import VerificationFlow from '@/app/instructor/verification/_components/verification-flow';

export const metadata: Metadata = { title: 'Xác minh giảng viên | SkillPath' };

export default function InstructorVerificationPage() {
  return <VerificationFlow />;
}
