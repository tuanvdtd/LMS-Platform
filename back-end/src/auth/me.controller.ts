import { Body, Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { AUTH, type Auth, type AuthSession, authCall } from './auth.js';
import { CurrentUser, StaffAllowed } from './decorators.js';

// 8–128 = mặc định minPasswordLength/maxPasswordLength của Better Auth.
const setPasswordSchema = z.object({ newPassword: z.string().min(8).max(128) });

@Controller('me')
export class MeController {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  @Get()
  @StaffAllowed()
  me(@CurrentUser() user: AuthSession['user']) {
    return user;
  }

  // Học viên tự bật vai trò giảng viên. Phải ghi qua
  // internalAdapter: nó refresh cache {session, user} trong Redis (secondaryStorage).
  // Ghi thẳng prisma.user thì guard vẫn đọc role cũ → 403. admin.setRole đòi quyền admin.
  @Post('become-instructor')
  @HttpCode(200)
  async becomeInstructor(@CurrentUser() user: AuthSession['user']) {
    const roles = user.role?.split(',').filter(Boolean) ?? [];
    if (roles.includes('instructor')) return user;
    const ctx = await this.auth.$context;
    return ctx.internalAdapter.updateUser(user.id, { role: [...roles, 'instructor'].join(',') });
  }

  // Tài khoản đăng ký bằng Google/GitHub chưa có mật khẩu → tạo lần đầu để đăng nhập bằng email và bật được 2FA.
  // setPassword của Better Auth chỉ gọi được từ server; đã có mật khẩu thì trả 400 PASSWORD_ALREADY_SET
  // (đổi mật khẩu phải qua /api/auth/change-password, có kiểm mật khẩu cũ).
  @Post('password')
  @HttpCode(200)
  setPassword(
    @Req() req: Request,
    @Body(new ZodValidationPipe(setPasswordSchema)) body: z.output<typeof setPasswordSchema>,
  ) {
    return authCall(() => this.auth.api.setPassword({ body, headers: fromNodeHeaders(req.headers) }));
  }
}
