import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { conversationId, imageUploadBody, listConversationsQuery, listMessagesQuery, openConversationBody, sendMessageBody, userIdParam, type ImageUploadBody, type ListConversationsQuery, type SendMessageBody } from './messages.schemas.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

type User = AuthSession['user'];
const pair = (c: { userAId: string; userBId: string }) => [c.userAId, c.userBId];
const id = new ZodValidationPipe(conversationId);

// Không @StaffAllowed: tài khoản nghiệp vụ không nhắn tin.
@Controller('conversations')
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly gateway: MessagesGateway,
  ) {}

  @Get()
  list(@CurrentUser() u: User, @Query(new ZodValidationPipe(listConversationsQuery)) q: ListConversationsQuery) {
    return this.messages.list(u.id, q);
  }

  @Get('unread-count')
  unread(@CurrentUser() u: User) {
    return this.messages.unreadCount(u.id);
  }

  @Get('peer/:userId')
  peer(@CurrentUser() u: User, @Param('userId', new ZodValidationPipe(userIdParam)) userId: string) {
    return this.messages.peer(u.id, userId);
  }

  @Post()
  open(@CurrentUser() u: User, @Body(new ZodValidationPipe(openConversationBody)) b: { userId: string }) {
    return this.messages.open(u.id, b.userId);
  }

  @Get(':id')
  detail(@CurrentUser() u: User, @Param('id', id) cid: string) {
    return this.messages.detail(u.id, cid);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() u: User, @Param('id', id) cid: string, @Query(new ZodValidationPipe(listMessagesQuery)) q: { before?: string }) {
    return this.messages.messages(u.id, cid, q.before);
  }

  @Post(':id/messages')
  async send(@CurrentUser() u: User, @Param('id', id) cid: string, @Body(new ZodValidationPipe(sendMessageBody)) b: SendMessageBody) {
    const { conv, dto } = await this.messages.send(u.id, cid, b);
    this.gateway.messageNew(pair(conv), dto);
    return dto;
  }

  @Post(':id/images')
  images(@CurrentUser() u: User, @Param('id', id) cid: string, @Body(new ZodValidationPipe(imageUploadBody)) b: ImageUploadBody) {
    return this.messages.requestImageUpload(u.id, cid, b);
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(@CurrentUser() u: User, @Param('id', id) cid: string) {
    const { conv, readAt } = await this.messages.markRead(u.id, cid);
    this.gateway.read(pair(conv), { conversationId: cid, userId: u.id, readAt: readAt.toISOString() });
  }

  @Post(':id/block')
  @HttpCode(204)
  async block(@CurrentUser() u: User, @Param('id', id) cid: string) {
    this.gateway.updated(pair(await this.messages.block(u.id, cid)), cid);
  }

  @Delete(':id/block')
  @HttpCode(204)
  async unblock(@CurrentUser() u: User, @Param('id', id) cid: string) {
    this.gateway.updated(pair(await this.messages.unblock(u.id, cid)), cid);
  }
}
