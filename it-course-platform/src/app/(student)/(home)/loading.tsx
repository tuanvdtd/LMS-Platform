import { GuestHomeSkeleton } from '@/components/skeletons/guest-home-skeleton';

// Trang '/' (khách) có loading riêng: loading.tsx của nhóm (student) là lưới khoá học, không đúng hình trang chủ.
export default function Loading() {
  return <GuestHomeSkeleton />;
}
