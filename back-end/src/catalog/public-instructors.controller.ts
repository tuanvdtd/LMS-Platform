// back-end/src/catalog/public-instructors.controller.ts
import { Controller, Get, Header, Param } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { CatalogService } from './catalog.service.js';

// Hồ sơ giảng viên công khai (spec public-catalog §3.5). Khác /instructor/* (có quyền).
@Public()
@Controller('instructors')
export class PublicInstructorsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60')
  get(@Param('id') id: string) {
    return this.catalog.instructor(id);
  }
}
