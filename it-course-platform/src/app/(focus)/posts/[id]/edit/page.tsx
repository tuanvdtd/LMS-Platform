import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PostEditorSkeleton } from '@/components/skeletons/my-posts-skeleton';
import { EditPost } from './_components/edit-post';

export const metadata: Metadata = { title: 'Soạn bài viết | Aolumi' };

// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function EditPostPage(props: PageProps<'/posts/[id]/edit'>) {
  return (
    <Suspense fallback={<PostEditorSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps<'/posts/[id]/edit'>) {
  const { id } = await params;
  return <EditPost key={id} id={id} />;
}
