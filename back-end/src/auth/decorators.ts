import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from './auth.js';
import type { AuthedRequest } from './auth.guard.js';

export const IS_PUBLIC = 'auth:public';
export const ROLES = 'auth:roles';
export const STAFF_ALLOWED = 'auth:staff-allowed';

/** Bỏ qua AuthGuard cho route/controller này. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Chỉ cho qua user có ít nhất một trong các role. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Cho tài khoản nghiệp vụ (admin/moderator) qua route không gắn @Roles staff. */
export const StaffAllowed = () => SetMetadata(STAFF_ALLOWED, true);

/** User của session hiện tại (AuthGuard đã gán). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
