// back-end/src/catalog/catalog.controller.ts
import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Header,
  Injectable,
  NestInterceptor,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { tap } from 'rxjs';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { listCoursesQuery, type ListCoursesQuery } from './catalog.schemas.js';
import { CatalogService } from './catalog.service.js';

// Chỉ gắn cache public khi thành công: tap không chạy khi handler ném lỗi nên 400/404/500 không bị cache.
@Injectable()
class PublicCacheInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const res = ctx.switchToHttp().getResponse<Response>();
    return next.handle().pipe(tap(() => res.setHeader('Cache-Control', 'public, max-age=60')));
  }
}

// API khoá public cho khách/học viên.
@Public()
@Controller('courses')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @UseInterceptors(PublicCacheInterceptor)
  list(@Query(new ZodValidationPipe(listCoursesQuery)) q: ListCoursesQuery) {
    return this.catalog.list(q);
  }

  @Get(':slug')
  @UseInterceptors(PublicCacheInterceptor)
  detail(@Param('slug') slug: string) {
    return this.catalog.detail(slug);
  }

  @Get(':slug/curriculum')
  @UseInterceptors(PublicCacheInterceptor)
  curriculum(@Param('slug') slug: string) {
    return this.catalog.curriculum(slug);
  }

  @Get(':slug/coupons/:code')
  @Header('Cache-Control', 'no-store')
  coupon(@Param('slug') slug: string, @Param('code') code: string) {
    return this.catalog.coupon(slug, code);
  }

  @Get(':slug/preview/:itemId')
  @Header('Cache-Control', 'no-store')
  preview(@Param('slug') slug: string, @Param('itemId') itemId: string) {
    return this.catalog.preview(slug, itemId);
  }
}
