import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createUploadSchema, libraryQuerySchema } from './assets.schemas.js';
import type { CreateUploadInput, LibraryQuery } from './assets.schemas.js';
import { AssetsService } from './assets.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post('uploads')
  createUpload(@CurrentUser() user: User, @Body(new ZodValidationPipe(createUploadSchema)) body: CreateUploadInput) {
    return this.assets.createUpload(user.id, body);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assets.complete(user.id, id);
  }

  @Get()
  library(@CurrentUser() user: User, @Query(new ZodValidationPipe(libraryQuerySchema)) query: LibraryQuery) {
    return this.assets.library(user.id, query.q);
  }

  @Get(':id/url')
  viewUrl(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assets.viewUrl(user.id, id);
  }
}
