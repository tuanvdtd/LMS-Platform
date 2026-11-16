import { Body, Controller, Get, Header, Param, Patch } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { updateProfileSchema, type UpdateProfileInput } from './profiles.schemas.js';
import { ProfilesService } from './profiles.service.js';

type User = AuthSession['user'];

@Controller()
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  // Trang cá nhân công khai của mọi người dùng (thay /instructors/:id).
  @Public()
  @Get('users/:id')
  @Header('Cache-Control', 'public, max-age=60')
  get(@Param('id') id: string) {
    return this.profiles.publicProfile(id);
  }

  @Get('me/profile')
  mine(@CurrentUser() user: User) {
    return this.profiles.mine(user.id);
  }

  @Patch('me/profile')
  update(@CurrentUser() user: User, @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput) {
    return this.profiles.update(user.id, body);
  }
}
