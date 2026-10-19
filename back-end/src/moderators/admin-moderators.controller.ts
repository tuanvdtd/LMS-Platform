import { Body, Controller, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createModeratorSchema, moderatorCategoriesSchema } from './moderators.schemas.js';
import type { CreateModeratorInput, ModeratorCategoriesInput } from './moderators.schemas.js';
import { ModeratorsService } from './moderators.service.js';

@Roles('admin')
@Controller('admin/moderators')
export class AdminModeratorsController {
  constructor(private readonly moderators: ModeratorsService) {}

  @Get()
  list() {
    return this.moderators.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createModeratorSchema)) body: CreateModeratorInput) {
    return this.moderators.create(body);
  }

  @Put(':id/categories')
  setCategories(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderatorCategoriesSchema)) body: ModeratorCategoriesInput,
  ) {
    return this.moderators.setCategories(id, body.categoryIds);
  }

  @Post(':id/lock')
  @HttpCode(200)
  lock(@Req() req: Request, @Param('id') id: string) {
    return this.moderators.lock(id, fromNodeHeaders(req.headers));
  }

  @Post(':id/unlock')
  @HttpCode(200)
  unlock(@Req() req: Request, @Param('id') id: string) {
    return this.moderators.unlock(id, fromNodeHeaders(req.headers));
  }

  @Post(':id/resend-invite')
  @HttpCode(204)
  resendInvite(@Param('id') id: string) {
    return this.moderators.resendInvite(id);
  }
}
