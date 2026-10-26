import { InstructorProfileSkeleton } from '@/components/skeletons/instructor-profile-skeleton';

// Route động: Link chỉ prefetch tới loading.tsx gần nhất → cần skeleton riêng, không rơi về lưới của nhóm (student).
export default function Loading() {
  return <InstructorProfileSkeleton />;
}
