import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PostArticle } from '@/components/post/post-article';
import { PostSkeleton } from '@/components/skeletons/post-skeleton';
import { getPost } from '@/lib/api/posts';
import { AdminPostActions } from './_components/admin-post-actions';

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Không tìm thấy bài viết | Aolumi' };
  return {
    title: `${post.title} | Aolumi`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      ...(post.coverUrl && { images: [post.coverUrl] }),
    },
  };
}

// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function PostPage(props: PageProps<'/blog/[slug]'>) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps<'/blog/[slug]'>) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  // JSON-LD tự dựng từ trường thuần, KHÔNG có bodyHtml; thay '<' để chuỗi không đóng được thẻ <script>.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': post.author.id ? 'Person' : 'Organization', name: post.author.name },
    ...(post.coverUrl && { image: [post.coverUrl] }),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <PostArticle post={post} actions={<AdminPostActions postId={post.id} />} />
    </>
  );
}
