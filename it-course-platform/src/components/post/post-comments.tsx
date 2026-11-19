'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { QaBoard, type QaApi, type QaCopy } from '@/components/qa/qa-board';
import type { RoleOf } from '@/components/qa/qa-thread';
import { QaListSkeleton } from '@/components/skeletons/qa-list-skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { createComment, deleteComment, getCommentThread, listComments } from '@/lib/api/post-engagement';
import { authClient } from '@/lib/auth-client';
import { isAdmin } from '@/lib/instructor-role';
import type { Answer, QaAuthor, Question } from '@/types/qa';
import type { CommentAuthor, PostComment, PostCommentThread } from '@/types/post';

const COMMENT_COPY: QaCopy = {
  askPlaceholder: 'Chia sẻ suy nghĩ của bạn về bài viết…',
  askSubmit: 'Gửi bình luận',
  more: 'Xem thêm bình luận',
  loadError: 'Không tải được bình luận',
  moreError: 'Không tải thêm được bình luận',
  sendError: 'Không gửi được bình luận',
  openError: 'Không mở được bình luận',
  notFound: 'Bình luận này đã bị xoá',
  notFoundCode: 'COMMENT_NOT_FOUND',
  deleteRootTitle: 'Xoá bình luận này?',
  deleteRootDescription: 'Các trả lời của bình luận cũng bị xoá. Không hoàn tác được.',
};

// Nhãn "Tác giả" cho người viết bài. Bài của tài khoản quản trị (không id) thì không gắn.
const authorRoleOf =
  (postAuthorId: string | null): RoleOf =>
  (c) =>
    postAuthorId && c.author.id === postAuthorId ? { label: 'Tác giả', tone: 'primary' } : null;

function CommentLoginPrompt({ href }: { href: string }) {
  return (
    <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
      <Link href={href} className="font-medium text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        Đăng nhập
      </Link>{' '}
      để bình luận
    </p>
  );
}

// Tài khoản quản trị không có id → '' (Thread hiện tên chữ thường, không link).
const person = (a: CommentAuthor): QaAuthor => ({ id: a.id ?? '', name: a.name, image: a.image });

// Bình luận bài viết trong drawer bên phải, dùng lại giao diện Hỏi đáp: gốc = câu hỏi, trả lời = câu trả lời.
// Mở bằng link "#comments" (dòng tác giả, nút cạnh nút tim, quay lại sau đăng nhập) hoặc ?comment= (thông báo):
// trang bài vẫn là server component, không cần chuyền state mở / đóng qua lại.
// Nút xoá tự tính ở đây (API công khai không biết người xem); BE kiểm lại khi xoá.
export function PostComments({ slug, postAuthorId }: { slug: string; postAuthorId: string | null }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hashOpen, setHashOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const isOpen = window.location.hash === '#comments';
      setHashOpen(isOpen);
      // Link "#comments" là anchor thường: trình duyệt tự tạo mục lịch sử không có state của Next.
      // Rời trang qua router (vd. "Đăng nhập") rồi bấm Back về mục đó thì Next bỏ qua → vẫn thấy trang cũ.
      // Ghi lại mục hiện tại qua router để Back vẽ lại đúng bài.
      if (isOpen) router.replace(`${window.location.pathname}${window.location.search}#comments`, { scroll: false });
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [router]);
  const meId = session?.user.id ?? null;
  const admin = isAdmin(session?.user);

  const api = useMemo<QaApi>(() => {
    const canDelete = (authorId: string | null) =>
      !!meId && ((authorId !== null && authorId === meId) || postAuthorId === meId || admin);
    const toAnswer = (c: PostComment): Answer => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: person(c.author),
      isInstructor: false,
      replyTo: c.replyTo && { id: c.replyTo.id ?? '', name: c.replyTo.name, answerId: c.replyTo.commentId },
      canDelete: canDelete(c.author.id),
    });
    const toQuestion = (t: PostCommentThread): Question => ({
      id: t.id,
      body: t.body,
      createdAt: t.createdAt,
      item: null,
      course: { id: '', title: '', slug: '' },
      author: person(t.author),
      canDelete: canDelete(t.author.id),
      answers: t.replies.map(toAnswer),
    });
    return {
      list: async (cursor) => {
        const p = await listComments(slug, cursor);
        return { items: p.items.map(toQuestion), total: p.commentCount, nextCursor: p.nextCursor };
      },
      get: async (id) => toQuestion(await getCommentThread(slug, id)),
      ask: async (body) => toQuestion({ ...(await createComment(slug, { body })), replyCount: 0, replies: [] }),
      // Trả lời thẳng vào gốc → gửi id gốc; BE tự gắn về gốc và không "@".
      answer: async (rootId, body, replyToAnswerId) =>
        toAnswer(await createComment(slug, { body, replyToCommentId: replyToAnswerId ?? rootId })),
      removeQuestion: deleteComment,
      removeAnswer: deleteComment,
    };
  }, [slug, meId, admin, postAuthorId]);

  const roleOf = useMemo(() => authorRoleOf(postAuthorId), [postAuthorId]);

  const root = searchParams.get('comment');
  const reply = searchParams.get('reply');
  const focus = useMemo(() => (root ? { questionId: root, answerId: reply ?? undefined } : undefined), [root, reply]);

  const open = hashOpen || !!root;
  // Đóng: bỏ cả hash lẫn ?comment= để lần bấm sau (cùng link) mở lại được.
  const close = () => {
    setHashOpen(false);
    router.replace(pathname, { scroll: false });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetTitle className="sr-only">Bình luận</SheetTitle>
        <div className="h-full overflow-y-auto overscroll-contain px-4 pt-4 pb-10 sm:px-6">
          {/* Chỉ tải khi mở. Đợi session: api phụ thuộc người xem, tạo lại sau khi session về sẽ tải danh sách 2 lần. */}
          {open &&
            (isPending ? (
              <QaListSkeleton />
            ) : (
              <QaBoard
                api={api}
                title="Bình luận"
                empty="Chưa có bình luận nào. Hãy là người đầu tiên."
                focus={focus}
                copy={COMMENT_COPY}
                composerOnTop
                countReplies
                autoLoadMore
                bubble
                roleOf={roleOf}
                guestPrompt={<CommentLoginPrompt href={`/login?redirect=${encodeURIComponent(`${pathname}#comments`)}`} />}
              />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
