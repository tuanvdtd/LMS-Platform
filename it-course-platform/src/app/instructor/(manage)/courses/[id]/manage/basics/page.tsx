import type { Metadata } from 'next';
import { getCategoryTree } from '@/lib/api/categories';
import { BasicsForm } from '../_components/basics-form';

export const metadata: Metadata = { title: 'Trang tổng quan | SkillPath' };

// Server component: cây danh mục lấy qua getCategoryTree (fetch cache 60s) có sẵn,
// truyền xuống CategoryPicker bằng props (spec §5.2). Dữ liệu khoá lấy từ CourseProvider (client).
export default async function BasicsPage() {
  return <BasicsForm categories={await getCategoryTree()} />;
}
