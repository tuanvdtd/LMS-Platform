import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({ imports: [CatalogModule], controllers: [ProfilesController], providers: [ProfilesService] })
export class ProfilesModule {}
