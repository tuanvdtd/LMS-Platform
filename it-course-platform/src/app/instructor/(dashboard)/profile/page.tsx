import type { Metadata } from 'next';
import ProfileForm from '@/app/instructor/(dashboard)/profile/_components/profile-form';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Hồ sơ giảng viên | SkillPath' };

export default function InstructorProfilePage() {
  return <ProfileForm />;
}
