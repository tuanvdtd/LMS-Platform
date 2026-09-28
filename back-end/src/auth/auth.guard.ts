import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH, type Auth, type AuthSession, type Role } from './auth.js';
import { IS_PUBLIC, ROLES } from './decorators.js';

export type AuthedRequest = Request & Partial<AuthSession>;

// Global guard (APP_GUARD). Không kiểm tra `banned`: plugin admin đã chặn tạo
// session và revoke session hiện có khi ban.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) throw new UnauthorizedException();
    req.user = session.user;
    req.session = session.session;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES,
      targets,
    );
    // Plugin admin cho phép nhiều role dạng "student,instructor".
    const userRoles = session.user.role?.split(',') ?? [];
    if (required && !required.some((r) => userRoles.includes(r))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
