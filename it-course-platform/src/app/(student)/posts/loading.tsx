import { MyPostsSkeleton } from '@/components/skeletons/my-posts-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <MyPostsSkeleton />
    </div>
  );
}
