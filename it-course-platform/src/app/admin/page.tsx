import type { Metadata } from 'next';
import { OverviewView } from './_components/overview-view';

export const metadata: Metadata = { title: 'Tổng quan | Aolumi Admin' };

// Moderator bị RoleGate (layout) chuyển sang hàng đợi duyệt khoá trước khi trang này render.
export default function AdminHome() {
  return <OverviewView />;
}
