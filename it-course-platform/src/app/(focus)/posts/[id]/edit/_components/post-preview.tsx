'use client';

import { useEffect, useState } from 'react';
import { PostArticle } from '@/components/post/post-article';
import { getCourse as getCatalogCourse, getProfile } from '@/lib/api/catalog';
import { getCourse as getMyCourse } from '@/lib/api/instructor-courses';
import { authClient } from '@/lib/auth-client';
import { isStaff } from '@/lib/instructor-role';
import type { CourseCard } from '@/types/catalog';
import type { PostDetail } from '@/types/post';

const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Cùng công thức với BE (post-rules.ts): 200 từ một phút, tóm tắt tự cắt 300 ký tự ở ranh giới từ.
function readingMinutes(html: string) {
  const words = plain(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
function autoExcerpt(html: string, max = 300) {
  const text = plain(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

export type PreviewInput = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  bodyHtml: string;
  topics: { slug: string; name: string }[];
  relatedCourseId: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

// Xem trước = chính trang đọc (PostArticle) dựng từ nội dung đang soạn, nên giống hệt bài người đọc thấy.
// Bỏ "Bài viết khác của tác giả" và "Bài cùng chủ đề" (sếp chốt 2026-11-18): không cần khi đang soạn.
export function PostPreview({ input }: { input: PreviewInput }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const staff = isStaff(user);
  const [about, setAbout] = useState<{ headline: string | null; bio: string | null } | null>(null);
  const [course, setCourse] = useState<{ id: string; card: CourseCard | null } | null>(null);

  // Hồ sơ tác giả cho thẻ cuối bài. Tài khoản quản trị đứng tên "Aolumi", không có hồ sơ.
  useEffect(() => {
    if (!user?.id || staff) return;
    let stale = false;
    getProfile(user.id).then(
      (p) => !stale && setAbout({ headline: p?.headline ?? null, bio: p?.bio ?? null }),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [user?.id, staff]);

  // Thẻ khoá liên quan: id → slug (khu giảng viên) → thẻ công khai (catalog), đúng thẻ người đọc thấy.
  const courseId = input.relatedCourseId;
  useEffect(() => {
    if (!courseId) return;
    let stale = false;
    getMyCourse(courseId)
      .then((c) => getCatalogCourse(c.slug))
      .then(
        (card) => !stale && setCourse({ id: courseId, card }),
        () => !stale && setCourse({ id: courseId, card: null }),
      );
    return () => {
      stale = true;
    };
  }, [courseId]);

  const now = new Date().toISOString();
  const post: PostDetail = {
    id: input.id,
    slug: input.slug ?? 'xem-truoc',
    title: input.title.trim() || 'Chưa có tiêu đề',
    excerpt: input.excerpt.trim() || autoExcerpt(input.bodyHtml),
    coverUrl: input.coverUrl,
    readingMinutes: readingMinutes(input.bodyHtml),
    likeCount: 0,
    commentCount: 0,
    publishedAt: input.publishedAt ?? now,
    updatedAt: input.publishedAt ? input.updatedAt : now,
    topics: input.topics,
    bodyHtml: input.bodyHtml,
    author: staff
      ? { id: null, name: 'Aolumi', image: null, headline: 'Đội ngũ Aolumi', bio: null }
      : {
          id: user?.id ?? null,
          name: user?.name ?? 'Bạn',
          image: user?.image ?? null,
          headline: about?.headline ?? null,
          bio: about?.bio ?? null,
        },
    relatedCourse: courseId && course?.id === courseId ? course.card : null,
    fromAuthor: [],
    more: [],
  };

  // Mục lục kiểu C chỉ lấy "Tiêu đề lớn" (h2) và chỉ hiện khi có từ 2 mục (post-toc.tsx).
  const sections = (input.bodyHtml.match(/<h2[\s>]/gi) ?? []).length;

  return (
    <>
      <p className="border-b bg-primary-soft px-4 py-2 text-center text-sm text-primary">
        Bản xem trước: đây là trang người đọc thấy sau khi bài xuất bản.
        {sections < 2 && ' Bài có từ 2 "Tiêu đề lớn" trở lên thì bên phải sẽ hiện mục lục.'}
      </p>
      <PostArticle post={post} preview />
    </>
  );
}
