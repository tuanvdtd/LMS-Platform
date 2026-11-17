import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createUploadSchema, libraryPageQuerySchema, libraryQuerySchema } from './assets.schemas.js';
import type { CreateUploadInput, LibraryPageQuery, LibraryQuery } from './assets.schemas.js';
import { AssetsService } from './assets.service.js';
import { LibraryService } from './library.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/assets')
export class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly files: LibraryService,
  ) {}

  @Post('uploads')
  createUpload(@CurrentUser() user: User, @Body(new ZodValidationPipe(createUploadSchema)) body: CreateUploadInput) {
    return this.assets.createUpload(user.id, body);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assets.complete(user.id, id);
  }

  // Ô chọn file trong trang soạn khoá: 50 file sẵn sàng mới nhất theo loại.
  @Get()
  library(@CurrentUser() user: User, @Query(new ZodValidationPipe(libraryQuerySchema)) query: LibraryQuery) {
    return this.assets.library(user.id, query.kind, query.q);
  }

  // Trang Thư viện file.
  @Get('library')
  libraryPage(@CurrentUser() user: User, @Query(new ZodValidationPipe(libraryPageQuerySchema)) query: LibraryPageQuery) {
    return this.files.page(user.id, query);
  }

  @Get(':id/usages')
  usages(@CurrentUser() user: User, @Param('id') id: string) {
    return this.files.usages(user.id, id);
  }

  @Get(':id/url')
  viewUrl(@CurrentUser() user: User, @Param('id') id: string, @Query('download') download?: string) {
    return this.assets.viewUrl(user.id, id, download === '1');
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.files.remove(user.id, id);
  }
}
