import type { Metadata } from 'next';
import { MyPosts } from './_components/my-posts';

export const metadata: Metadata = { title: 'Bài viết của tôi | Aolumi' };

export default function MyPostsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <MyPosts />
    </div>
  );
}
