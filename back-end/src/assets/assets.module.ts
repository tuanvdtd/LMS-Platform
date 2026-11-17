import { Module } from '@nestjs/common';
import { HlsModule } from '../hls/hls.module.js';
import { AssetsCleanupService } from './assets-cleanup.service.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import { LibraryService } from './library.service.js';
import { StorageUsageService } from './usage.service.js';

@Module({
  imports: [HlsModule],
  controllers: [AssetsController],
  providers: [AssetsService, StorageUsageService, LibraryService, AssetsCleanupService],
})
export class AssetsModule {}
