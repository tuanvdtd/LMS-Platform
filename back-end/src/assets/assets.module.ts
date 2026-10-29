import { Module } from '@nestjs/common';
import { HlsModule } from '../hls/hls.module.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({ imports: [HlsModule], controllers: [AssetsController], providers: [AssetsService] })
export class AssetsModule {}
