import type { Metadata } from 'next';
import { PremiumFlow } from './_components/premium-flow';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Giảng viên cao cấp | SkillPath' };

export default function InstructorVerificationPage() {
  return (
    <div className="flex-1 p-6">
      <PremiumFlow />
    </div>
  );
}
