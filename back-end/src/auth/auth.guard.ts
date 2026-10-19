import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH, type Auth, type AuthSession, type Role, STAFF_ROLES } from './auth.js';
import { IS_PUBLIC, ROLES, STAFF_ALLOWED } from './decorators.js';

export type AuthedRequest = Request & Partial<AuthSession>;

// Mặc định chặn staff: route mới viết sau tự an toàn, chỉ mở khi @Roles có role staff
// của user hoặc gắn @StaffAllowed().
export function staffBlocked(userRoles: string[], required: Role[] | undefined, staffAllowed: boolean): boolean {
  const staff = STAFF_ROLES.filter((r) => userRoles.includes(r));
  if (!staff.length || staffAllowed) return false;
  return !required?.some((r) => staff.includes(r));
}

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
    // Chỉ id + role (spec §2); email/tên không rời khỏi hệ thống.
    Sentry.setUser({ id: session.user.id, role: session.user.role });

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES,
      targets,
    );
    // Plugin admin cho phép nhiều role dạng "student,instructor".
    const userRoles = session.user.role?.split(',') ?? [];
    if (required && !required.some((r) => userRoles.includes(r))) {
      throw new ForbiddenException();
    }
    if (staffBlocked(userRoles, required, !!this.reflector.getAllAndOverride<boolean>(STAFF_ALLOWED, targets))) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'STAFF_ACCOUNT',
        message: 'Tài khoản nghiệp vụ không dùng được chức năng này',
      });
    }
    return true;
  }
}
