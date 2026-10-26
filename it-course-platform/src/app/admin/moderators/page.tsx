import type { Metadata } from 'next';
import { getCategoryTree } from '@/lib/api/categories';
import { ModeratorsView } from './_components/moderators-view';

export const metadata: Metadata = { title: 'Moderator | SkillPath Admin' };

// Danh mục cấp 1 lấy từ cây có cache sẵn ở server, không gọi thêm API từ client.
export default async function AdminModeratorsPage() {
  return <ModeratorsView categories={await getCategoryTree()} />;
}
