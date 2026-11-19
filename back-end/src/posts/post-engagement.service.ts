import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthSession } from '../auth/auth.js';
import { tooManyRequests } from '../common/http.js';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import {
  canDeleteComment,
  commentLink,
  excerptLine,
  noticeTitle,
  publicAuthor,
  recipients,
  removedCount,
  rootOf,
} from './post-engagement-rules.js';
import type { CreateCommentInput } from './posts.schemas.js';
import { postNotFound } from './posts.service.js';

type User = AuthSession['user'];

const PAGE = 20;
const PERSON = { select: { id: true, name: true, image: true, role: true } } as const;
const COMMENT_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  parentId: true,
  replyToCommentId: true,
  user: PERSON,
  replyTo: PERSON,
} satisfies Prisma.PostCommentSelect;
// ponytail: kéo hết trả lời của 20 gốc mỗi trang, giống Hỏi đáp; thêm giới hạn khi một bình luận có hàng trăm trả lời.
const THREAD_SELECT = {
  ...COMMENT_SELECT,
  replyCount: true,
  replies: { orderBy: { id: 'asc' }, select: COMMENT_SELECT },
} satisfies Prisma.PostCommentSelect;
type CommentRow = Prisma.PostCommentGetPayload<{ select: typeof COMMENT_SELECT }>;
type ThreadRow = Prisma.PostCommentGetPayload<{ select: typeof THREAD_SELECT }>;

export const commentNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'COMMENT_NOT_FOUND', message: 'Không tìm thấy bình luận' });

const present = (c: CommentRow) => {
  const target = c.replyTo && publicAuthor(c.replyTo);
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    parentId: c.parentId,
    author: publicAuthor(c.user),
    // commentId null: bình luận đích đã bị xoá → FE hiện "@Tên" không bấm được.
    replyTo: target && { id: target.id, name: target.name, commentId: c.replyToCommentId },
  };
};
const presentThread = (t: ThreadRow) => ({ ...present(t), replyCount: t.replyCount, replies: t.replies.map(present) });

// Tim + bình luận bài blog. Chỉ bài đang xuất bản; khác → 404 như trang đọc.
// Cột đếm trên posts / replyCount chỉ đổi trong cùng transaction với lệnh ghi tương ứng.
// ponytail: xoá tài khoản thì DB cascade xoá tim/bình luận nhưng không trừ cột đếm → có thể lệch; cần thì chạy SQL đếm lại.
@Injectable()
export class PostEngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsGateway,
  ) {}

  private async publishedPost(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'published' },
      select: { id: true, title: true, authorId: true, likeCount: true, commentCount: true },
    });
    if (!post) throw postNotFound();
    return post;
  }

  async likeState(slug: string, userId: string) {
    const post = await this.publishedPost(slug);
    const like = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId: post.id, userId } },
      select: { userId: true },
    });
    return { liked: !!like, likeCount: post.likeCount };
  }

  // Idempotent: bấm 2 lần không đếm đôi. Không dùng create vì trùng khoá ném P2002 làm hỏng transaction.
  async setLike(slug: string, userId: string, liked: boolean) {
    if (!(await rateLimit(this.redis, `rl:post-like:${userId}`, 60, 60))) throw tooManyRequests();
    const post = await this.publishedPost(slug);
    const likeCount = await this.prisma.$transaction(async (tx) => {
      const changed = liked
        ? await tx.$executeRaw`INSERT INTO post_likes ("postId", "userId") VALUES (${post.id}::uuid, ${userId}::uuid) ON CONFLICT DO NOTHING`
        : (await tx.postLike.deleteMany({ where: { postId: post.id, userId } })).count;
      const row = changed
        ? await tx.post.update({
            where: { id: post.id },
            data: { likeCount: liked ? { increment: 1 } : { decrement: 1 } },
            select: { likeCount: true },
          })
        : await tx.post.findUniqueOrThrow({ where: { id: post.id }, select: { likeCount: true } });
      return row.likeCount;
    }, TX_OPTIONS);
    return { liked, likeCount };
  }

  async list(slug: string, cursor?: string) {
    const post = await this.publishedPost(slug);
    const rows = await this.prisma.postComment.findMany({
      where: { postId: post.id, parentId: null, ...(cursor && { id: { lt: cursor } }) },
      orderBy: { id: 'desc' }, // uuid v7 tăng theo thời gian → mới nhất trước
      take: PAGE + 1,
      select: THREAD_SELECT,
    });
    const items = rows.slice(0, PAGE);
    return {
      items: items.map(presentThread),
      commentCount: post.commentCount,
      nextCursor: rows.length > PAGE ? items[items.length - 1].id : null,
    };
  }

  // Mở từ thông báo khi luồng không nằm ở trang đầu. Nhận cả id trả lời → trả luồng chứa nó.
  async thread(slug: string, commentId: string) {
    const post = await this.publishedPost(slug);
    if (!isGuid(commentId)) throw commentNotFound();
    const c = await this.prisma.postComment.findFirst({
      where: { id: commentId, postId: post.id },
      select: { id: true, parentId: true },
    });
    if (!c) throw commentNotFound();
    const root = await this.prisma.postComment.findUnique({ where: { id: rootOf(c) }, select: THREAD_SELECT });
    if (!root) throw commentNotFound(); // gốc vừa bị xoá song song
    return presentThread(root);
  }

  async create(slug: string, user: User, input: CreateCommentInput) {
    if (!(await rateLimit(this.redis, `rl:post-comment:${user.id}`, 10, 60))) throw tooManyRequests();
    const post = await this.publishedPost(slug);
    const { comment, notifications } = await this.prisma.$transaction(async (tx) => {
      let parentId: string | null = null;
      let repliedUserId: string | null = null;
      let mention: { id: string; userId: string } | null = null;
      if (input.replyToCommentId) {
        const t = await tx.postComment.findFirst({
          where: { id: input.replyToCommentId, postId: post.id },
          select: { id: true, userId: true, parentId: true },
        });
        if (!t) throw commentNotFound();
        parentId = rootOf(t);
        // Khoá gốc: xoá gốc / xoá trả lời song song phải chờ → replyCount, commentCount không lệch.
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM post_comments WHERE id = ${parentId}::uuid FOR UPDATE`;
        if (!locked.length) throw commentNotFound();
        repliedUserId = t.userId;
        // "@Tên" chỉ khi trả lời một trả lời khác; trả lời thẳng vào gốc thì không, giống Hỏi đáp.
        if (t.parentId) mention = { id: t.id, userId: t.userId };
      }
      const c = await tx.postComment
        .create({
          data: {
            postId: post.id,
            userId: user.id,
            parentId,
            body: input.body,
            replyToCommentId: mention?.id ?? null,
            replyToUserId: mention?.userId ?? null,
          },
          select: COMMENT_SELECT,
        })
        .catch((e: unknown) => {
          // Trả lời đích bị xoá giữa lúc tra và lúc ghi → khoá ngoại hỏng: 404 thay vì 500.
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw commentNotFound();
          throw e;
        });
      await tx.post.update({ where: { id: post.id }, data: { commentCount: { increment: 1 } } });
      if (parentId) await tx.postComment.update({ where: { id: parentId }, data: { replyCount: { increment: 1 } } });

      const writer = publicAuthor(user);
      const link = commentLink(slug, parentId ?? c.id, parentId ? c.id : undefined);
      const notifications = [];
      for (const n of recipients(user.id, post.authorId, repliedUserId)) {
        notifications.push(
          await tx.notification.create({
            data: {
              userId: n.userId,
              type: 'post_comment',
              title: noticeTitle(n.kind, writer.name, post.title),
              body: excerptLine(input.body),
              link,
              data: { postId: post.id, commentId: c.id, parentId },
            },
          }),
        );
      }
      return { comment: present(c), notifications };
    }, TX_OPTIONS);
    // Đẩy sau commit: transaction hỏng thì không báo một bình luận không tồn tại.
    for (const n of notifications) this.notifications.push(n);
    return comment;
  }

  // Không có quyền / không tồn tại / bài không còn xuất bản → 404, không lộ bình luận có tồn tại.
  async remove(id: string, viewer: User) {
    if (!isGuid(id)) throw commentNotFound();
    const c = await this.prisma.postComment.findUnique({
      where: { id },
      select: { id: true, userId: true, parentId: true, post: { select: { id: true, authorId: true, status: true } } },
    });
    if (!c || c.post.status !== 'published' || !canDeleteComment(viewer, c.userId, c.post.authorId)) throw commentNotFound();
    await this.prisma.$transaction(async (tx) => {
      // Khoá gốc (chính nó nếu là gốc) và đọc replyCount dưới khoá: trả lời mới không chen vào giữa lúc đếm.
      const locked = await tx.$queryRaw<{ replyCount: number }[]>`
        SELECT "replyCount" FROM post_comments WHERE id = ${c.parentId ?? c.id}::uuid FOR UPDATE`;
      if (!locked.length) return; // gốc đã bị xoá song song, kéo theo dòng này
      const { count } = await tx.postComment.deleteMany({ where: { id } });
      if (!count) return; // đã bị xoá song song → không trừ lần hai
      const removed = removedCount({ parentId: c.parentId, replyCount: locked[0].replyCount });
      await tx.post.update({ where: { id: c.post.id }, data: { commentCount: { decrement: removed } } });
      if (c.parentId) await tx.postComment.update({ where: { id: c.parentId }, data: { replyCount: { decrement: 1 } } });
    }, TX_OPTIONS);
  }
}
