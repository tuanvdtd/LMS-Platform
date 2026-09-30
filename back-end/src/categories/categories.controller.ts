import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { CategoriesService } from './categories.service.js';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  // FE cache phía server (cacheLife hours); max-age ngắn cho client/CDN.
  @Get('tree')
  @Header('Cache-Control', 'public, max-age=300')
  tree() {
    return this.categories.tree();
  }
}
