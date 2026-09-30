import type { Metadata } from 'next';
import { getCategoryTree } from '@/lib/api/categories';
import { BasicsForm } from '../_components/basics-form';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Trang tổng quan | SkillPath' };

// Server component: cây danh mục lấy qua getCategoryTree ('use cache', cacheLife hours) có sẵn,
// truyền xuống CategoryPicker bằng props (spec §5.2). Dữ liệu khoá lấy từ CourseProvider (client).
export default async function BasicsPage() {
  return <BasicsForm categories={await getCategoryTree()} />;
}
