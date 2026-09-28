import { Controller, Get } from '@nestjs/common';
import type { AuthSession } from './auth.js';
import { CurrentUser } from './decorators.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: AuthSession['user']) {
    return user;
  }
}
