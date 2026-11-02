import { Module } from '@nestjs/common';
import { HlsService } from './hls.service.js';
import { MediaConvertWebhookController } from './mediaconvert-webhook.controller.js';
import { MediaConvertGateway } from './mediaconvert.gateway.js';

@Module({
  controllers: [MediaConvertWebhookController],
  providers: [HlsService, MediaConvertGateway],
  exports: [HlsService],
})
export class HlsModule {}
