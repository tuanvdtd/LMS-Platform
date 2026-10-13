// back-end/src/catalog/catalog.module.ts
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { PublicInstructorsController } from './public-instructors.controller.js';
import { CatalogService } from './catalog.service.js';

@Module({ controllers: [CatalogController, PublicInstructorsController], providers: [CatalogService] })
export class CatalogModule {}
