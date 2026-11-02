// back-end/src/recommendations/recommendations.controller.ts
import { Controller, Get } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { RecommendationsService } from './recommendations.service.js';

@Controller('me/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthSession['user']) {
    return { groups: await this.recommendations.groups(user.id) };
  }
}
