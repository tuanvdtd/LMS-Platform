import { Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { AUTH, type Auth, type AuthSession } from './auth.js';
import { CurrentUser } from './decorators.js';

@Controller('me')
export class MeController {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  @Get()
  me(@CurrentUser() user: AuthSession['user']) {
    return user;
  }

  // Học viên tự bật vai trò giảng viên (spec course-create-basics C6). Phải ghi qua
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
}
