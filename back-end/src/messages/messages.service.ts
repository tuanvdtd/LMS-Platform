import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Message } from '@prisma/client';
import { conflict, forbidden, tooManyRequests } from '../common/http.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { StorageService } from '../infra/storage.service.js';
import { STAFF_ROLES } from '../auth/auth.js';
import { v7 as uuidv7 } from 'uuid';
import { blockedState, cannotSend, CANNOT_SEND_MESSAGE, IMAGE_MAX_BYTES, isMessageImageKey, orderPair, otherOf, readField, readMarks, type CannotSend, type ImageMime } from './messages-rules.js';
import type { ImageUploadBody, ListConversationsQuery, SendMessageBody } from './messages.schemas.js';

const IMAGE_EXT: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const LIST_PAGE = 20;
const MSG_PAGE = 30;
const IMG_TTL = 3600;
const PREVIEW = 120;
const notFound = () => new NotFoundException({ statusCode: 404, code: 'CONVERSATION_NOT_FOUND', message: 'Không tìm thấy cuộc trò chuyện' });
const CONV = { id: true, userAId: true, userBId: true, aLastReadAt: true, bLastReadAt: true, blockedById: true } as const;
const USER = { id: true, name: true, image: true } as const;

export type MessageDto = { id: string; conversationId: string; senderId: string; body: string; images: { key: string; url: string }[]; createdAt: string };

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  // Người ngoài cuộc → 404 (không lộ cuộc có tồn tại).
  private async member(me: string, id: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id }, select: CONV });
    if (!c || (c.userAId !== me && c.userBId !== me)) throw notFound();
    return c;
  }

  // Ghi danh trả phí nối hai người, theo cả hai chiều.
  private paidLinks(me: string, other: string) {
    return this.prisma.enrollment.findMany({
      where: {
        orderId: { not: null },
        OR: [
          { userId: me, course: { instructorId: other } },
          { userId: other, course: { instructorId: me } },
        ],
      },
      select: { userId: true, courseId: true, progressPct: true, lastAccessedAt: true, course: { select: { id: true, title: true, slug: true } } },
    });
  }
  private async hasPaidLink(me: string, other: string) {
    return (await this.paidLinks(me, other)).length > 0;
  }

  async toMessageDto(m: Message): Promise<MessageDto> {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      images: await Promise.all(m.imageKeys.map(async (key) => ({ key, url: await this.storage.presignGet('private', key, IMG_TTL) }))),
      createdAt: m.createdAt.toISOString(),
    };
  }

  async list(me: string, { cursor, q }: ListConversationsQuery) {
    const mine: Prisma.ConversationWhereInput = q
      ? { OR: [
          { userAId: me, userB: { name: { contains: q, mode: 'insensitive' } } },
          { userBId: me, userA: { name: { contains: q, mode: 'insensitive' } } },
        ] }
      : { OR: [{ userAId: me }, { userBId: me }] };
    let after: Prisma.ConversationWhereInput = {};
    if (cursor) {
      const [iso, id] = cursor.split('|');
      const t = new Date(iso);
      after = { OR: [{ lastMessageAt: { lt: t } }, { lastMessageAt: t, id: { lt: id } }] };
    }
    const rows = await this.prisma.conversation.findMany({
      where: { AND: [mine, { lastMessageAt: { not: null } }, after] },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      take: LIST_PAGE + 1,
      select: {
        ...CONV,
        lastMessageAt: true,
        userA: { select: USER },
        userB: { select: USER },
      },
    });
    const page = rows.slice(0, LIST_PAGE);
    const ids = page.map((c) => c.id);
    const unread = await this.unreadByConversation(me, ids);
    const lasts = await this.lastMessages(ids);
    return {
      items: page.map((c) => {
        const last = lasts.get(c.id);
        return {
          id: c.id,
          other: c.userAId === me ? c.userB : c.userA,
          lastMessage: last
            ? { body: last.body, hasImages: last.hasImages, senderIsMe: last.senderId === me, createdAt: last.createdAt.toISOString() }
            : null,
          unreadCount: unread.get(c.id) ?? 0,
          blocked: blockedState(c, me),
        };
      }),
      nextCursor: rows.length > LIST_PAGE ? `${page[LIST_PAGE - 1].lastMessageAt!.toISOString()}|${page[LIST_PAGE - 1].id}` : null,
    };
  }

  // Tin cuối mỗi cuộc: một truy vấn DISTINCT ON (dùng index conversationId, createdAt), cắt xem trước ở DB.
  private async lastMessages(ids: string[]) {
    if (!ids.length) return new Map<string, { body: string; hasImages: boolean; senderId: string; createdAt: Date }>();
    const rows = await this.prisma.$queryRaw<{ conversationId: string; body: string; hasImages: boolean; senderId: string; createdAt: Date }[]>`
      SELECT DISTINCT ON (m."conversationId") m."conversationId", left(m.body, ${PREVIEW}::int) AS body,
        cardinality(m."imageKeys") > 0 AS "hasImages", m."senderId", m."createdAt"
      FROM messages m WHERE m."conversationId" = ANY(${ids}::uuid[])
      ORDER BY m."conversationId", m."createdAt" DESC, m.id DESC`;
    return new Map(rows.map((r) => [r.conversationId, r]));
  }

  private async unreadByConversation(me: string, ids: string[]) {
    if (!ids.length) return new Map<string, number>();
    const rows = await this.prisma.$queryRaw<{ id: string; n: number }[]>`
      SELECT m."conversationId" AS id, COUNT(*)::int AS n
      FROM messages m JOIN conversations c ON c.id = m."conversationId"
      WHERE m."conversationId" = ANY(${ids}::uuid[]) AND m."senderId" <> ${me}::uuid
        AND m."createdAt" > COALESCE(CASE WHEN c."userAId" = ${me}::uuid THEN c."aLastReadAt" ELSE c."bLastReadAt" END, 'epoch')
      GROUP BY m."conversationId"`;
    return new Map(rows.map((r) => [r.id, r.n]));
  }

  // Số CUỘC có tin chưa đọc (badge header, kiểu Messenger).
  async unreadCount(me: string) {
    const [{ count }] = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM conversations c
      WHERE (c."userAId" = ${me}::uuid OR c."userBId" = ${me}::uuid) AND c."lastMessageAt" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM messages m WHERE m."conversationId" = c.id AND m."senderId" <> ${me}::uuid
            AND m."createdAt" > COALESCE(CASE WHEN c."userAId" = ${me}::uuid THEN c."aLastReadAt" ELSE c."bLastReadAt" END, 'epoch'))`;
    return { count };
  }

  async peer(me: string, userId: string) {
    if (userId === me) return { conversationId: null, canMessage: false };
    const [a, b] = orderPair(me, userId);
    const c = await this.prisma.conversation.findUnique({ where: { userAId_userBId: { userAId: a, userBId: b } }, select: CONV });
    const paid = await this.hasPaidLink(me, userId);
    return { conversationId: c?.id ?? null, canMessage: c ? cannotSend(c, me, paid) === null : paid };
  }

  async open(me: string, userId: string) {
    if (userId === me) throw notFound();
    const other = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    const roles = other?.role?.split(',') ?? [];
    if (!other || STAFF_ROLES.some((r) => roles.includes(r))) throw notFound();
    if (!(await this.hasPaidLink(me, userId))) throw forbidden('NO_PAID_LINK', CANNOT_SEND_MESSAGE.NO_PAID_LINK);
    const [a, b] = orderPair(me, userId);
    const where = { userAId_userBId: { userAId: a, userBId: b } };
    const found = await this.prisma.conversation.findUnique({ where, select: { id: true } });
    if (found) return found;
    if (!(await rateLimit(this.redis, `rl:conv-new:${me}`, 30, 86_400))) throw tooManyRequests();
    try {
      return await this.prisma.conversation.create({ data: { userAId: a, userBId: b }, select: { id: true } });
    } catch (e) {
      // Hai bên mở cùng lúc → bản kia đã tạo.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return this.prisma.conversation.findUniqueOrThrow({ where, select: { id: true } });
      throw e;
    }
  }

  async detail(me: string, id: string) {
    const c = await this.member(me, id);
    const otherId = otherOf(c, me);
    const [other, links] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: otherId }, select: USER }),
      this.paidLinks(me, otherId),
    ]);
    // Đánh giá chỉ lấy ở khoá của tôi mà người kia là học viên.
    const studentCourseIds = links.filter((l) => l.userId === otherId).map((l) => l.courseId);
    const reviews = studentCourseIds.length
      ? await this.prisma.courseReview.findMany({ where: { userId: otherId, courseId: { in: studentCourseIds } }, select: { courseId: true, rating: true, comment: true, createdAt: true } })
      : [];
    const reason = cannotSend(c, me, links.length > 0);
    return {
      id: c.id,
      other,
      canSend: reason === null,
      reason,
      blocked: blockedState(c, me),
      otherLastReadAt: readMarks(c, me).other?.toISOString() ?? null,
      courses: links.map((l) => {
        const otherIsStudent = l.userId === otherId;
        const r = reviews.find((x) => x.courseId === l.courseId);
        return {
          ...l.course,
          otherIsStudent,
          progressPct: otherIsStudent ? Number(l.progressPct) : null,
          lastAccessedAt: otherIsStudent ? (l.lastAccessedAt?.toISOString() ?? null) : null,
          review: r ? { rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString() } : null,
        };
      }),
    };
  }

  async messages(me: string, id: string, before?: string) {
    await this.member(me, id);
    if (before && !(await this.prisma.message.findFirst({ where: { id: before, conversationId: id }, select: { id: true } }))) {
      return { items: [], hasMore: false };
    }
    const rows = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MSG_PAGE + 1,
      ...(before && { cursor: { id: before }, skip: 1 }),
    });
    const page = rows.slice(0, MSG_PAGE);
    return { items: await Promise.all(page.map((m) => this.toMessageDto(m))), hasMore: rows.length > MSG_PAGE };
  }

  async send(me: string, id: string, input: SendMessageBody) {
    const c = await this.member(me, id);
    if (!(await rateLimit(this.redis, `rl:msg:${me}`, 20, 60))) throw tooManyRequests();
    const reason: CannotSend | null = cannotSend(c, me, await this.hasPaidLink(me, otherOf(c, me)));
    if (reason) throw forbidden(reason, CANNOT_SEND_MESSAGE[reason]);
    await this.checkImages(id, input.imageKeys);
    const now = new Date();
    const [msg] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId: id, senderId: me, body: input.body, imageKeys: input.imageKeys, createdAt: now } }),
      this.prisma.conversation.update({ where: { id }, data: { lastMessageAt: now } }),
      this.setReadMark(id, readField(c, me), now),
    ]);
    return { conv: c, dto: await this.toMessageDto(msg) };
  }

  async requestImageUpload(me: string, id: string, { mimeType, sizeBytes }: ImageUploadBody) {
    const c = await this.member(me, id);
    if (!(await rateLimit(this.redis, `rl:msg-img:${me}`, 60, 3600))) throw tooManyRequests();
    const reason = cannotSend(c, me, await this.hasPaidLink(me, otherOf(c, me)));
    if (reason) throw forbidden(reason, CANNOT_SEND_MESSAGE[reason]);
    const key = `messages/${id}/${uuidv7()}.${IMAGE_EXT[mimeType]}`;
    // ponytail: ảnh xin link mà không gửi thì nằm lại bucket; dọn theo tiền tố messages/ bằng lifecycle rule khi cần.
    return { key, uploadUrl: await this.storage.presignPut('private', key, mimeType, sizeBytes) };
  }

  private async checkImages(id: string, keys: string[]) {
    const bad = () => new BadRequestException({ statusCode: 400, code: 'INVALID_IMAGE', message: 'Ảnh không hợp lệ hoặc chưa tải lên xong' });
    if (new Set(keys).size !== keys.length || keys.some((k) => !isMessageImageKey(id, k))) throw bad();
    const heads = await Promise.all(keys.map((k) => this.storage.head('private', k)));
    if (heads.some((h) => !h || h.size > IMAGE_MAX_BYTES)) throw bad();
  }

  // Mốc đã đọc không bao giờ lùi (spec §7).
  private setReadMark(id: string, field: 'aLastReadAt' | 'bLastReadAt', at: Date) {
    return field === 'aLastReadAt'
      ? this.prisma.$executeRaw`UPDATE conversations SET "aLastReadAt" = GREATEST(COALESCE("aLastReadAt", 'epoch'), ${at}) WHERE id = ${id}::uuid`
      : this.prisma.$executeRaw`UPDATE conversations SET "bLastReadAt" = GREATEST(COALESCE("bLastReadAt", 'epoch'), ${at}) WHERE id = ${id}::uuid`;
  }

  async markRead(me: string, id: string) {
    const c = await this.member(me, id);
    const readAt = new Date();
    await this.setReadMark(id, readField(c, me), readAt);
    return { conv: c, readAt };
  }

  async block(me: string, id: string) {
    const c = await this.member(me, id);
    if (c.blockedById === me) return c;
    if (c.blockedById) throw conflict('ALREADY_BLOCKED', 'Cuộc trò chuyện đang bị chặn');
    const { count } = await this.prisma.conversation.updateMany({ where: { id, blockedById: null }, data: { blockedById: me, blockedAt: new Date() } });
    if (!count) throw conflict('ALREADY_BLOCKED', 'Cuộc trò chuyện đang bị chặn');
    return c;
  }

  async unblock(me: string, id: string) {
    const c = await this.member(me, id);
    if (!c.blockedById) return c;
    if (c.blockedById !== me) throw forbidden('NOT_BLOCKER', 'Chỉ người chặn mới bỏ chặn được');
    await this.prisma.conversation.updateMany({ where: { id, blockedById: me }, data: { blockedById: null, blockedAt: null } });
    return c;
  }
}
