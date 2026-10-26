import type { Metadata } from 'next';
import { PremiumFlow } from './_components/premium-flow';

export const metadata: Metadata = { title: 'Giảng viên cao cấp | SkillPath' };

export default function InstructorVerificationPage() {
  return (
    <div className="flex-1 p-6">
      <PremiumFlow />
    </div>
  );
}
