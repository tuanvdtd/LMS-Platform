import type { Metadata } from 'next';
import ProfileForm from '@/app/instructor/profile/_components/profile-form';

export const metadata: Metadata = { title: 'Hồ sơ giảng viên | SkillPath' };

export default function InstructorProfilePage() {
  return <ProfileForm />;
}
