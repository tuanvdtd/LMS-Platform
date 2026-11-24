import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { lockUserSchema, usersQuery, type LockUserInput, type UsersQuery } from './admin.schemas.js';
import { AdminUsersService } from './admin-users.service.js';

type User = AuthSession['user'];

@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(usersQuery)) q: UsersQuery) {
    return this.users.list(q);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.users.detail(id);
  }

  @Post(':id/lock')
  @HttpCode(200)
  lock(
    @Req() req: Request,
    @CurrentUser() me: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(lockUserSchema)) body: LockUserInput,
  ) {
    return this.users.lock(id, me.id, body, fromNodeHeaders(req.headers));
  }

  @Post(':id/unlock')
  @HttpCode(200)
  unlock(@Req() req: Request, @CurrentUser() me: User, @Param('id') id: string) {
    return this.users.unlock(id, me.id, fromNodeHeaders(req.headers));
  }

  @Post(':id/revoke-sessions')
  @HttpCode(200)
  revokeSessions(@Req() req: Request, @CurrentUser() me: User, @Param('id') id: string) {
    return this.users.revokeSessions(id, me.id, fromNodeHeaders(req.headers));
  }
}
