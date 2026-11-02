// back-end/src/recommendations/recommendations.module.ts
import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';

@Module({ imports: [CatalogModule], controllers: [RecommendationsController], providers: [RecommendationsService] })
export class RecommendationsModule {}
