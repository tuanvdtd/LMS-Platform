import type { Metadata } from 'next';
import ProfileForm from '@/app/instructor/(dashboard)/profile/_components/profile-form';

export const metadata: Metadata = { title: 'Tài khoản nhận tiền | SkillPath' };

export default function InstructorProfilePage() {
  return <ProfileForm />;
}
