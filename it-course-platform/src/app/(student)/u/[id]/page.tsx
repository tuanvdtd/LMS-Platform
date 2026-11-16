import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton';
import { getProfile } from '@/lib/api/catalog';
import { ProfileView } from './_components/profile-view';

export async function generateMetadata({ params }: PageProps<'/u/[id]'>): Promise<Metadata> {
  const p = await getProfile((await params).id);
  if (!p) return { title: 'Không tìm thấy người dùng | SkillPath' };
  return { title: `${p.name} | SkillPath`, description: p.headline ?? `Trang cá nhân của ${p.name} trên SkillPath` };
}

// Trang cá nhân công khai của mọi người dùng; giảng viên có thêm phần giảng dạy.
// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function ProfilePage(props: PageProps<'/u/[id]'>) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps<'/u/[id]'>) {
  const p = await getProfile((await params).id);
  if (!p) notFound();
  return <ProfileView p={p} />;
}
