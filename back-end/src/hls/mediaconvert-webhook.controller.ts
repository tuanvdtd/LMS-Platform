import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { Public } from '../auth/decorators.js';
import { HlsService } from './hls.service.js';

// EventBridge rule "MediaConvert Job State Change" → API destination gửi nguyên event JSON.
const eventSchema = z.object({ detail: z.object({ jobId: z.string().min(1), status: z.string() }) });

// Xác thực bằng header bí mật mà EventBridge connection gắn kèm; sai secret → 401 trước khi xét nội dung body.
@Public()
@Controller('webhooks')
export class MediaConvertWebhookController {
  constructor(private readonly hls: HlsService) {}

  @Post('mediaconvert')
  @HttpCode(200)
  async handle(@Headers('x-mediaconvert-secret') secret: string | undefined, @Body() body: unknown) {
    if (!this.hls.verifySecret(secret)) throw new UnauthorizedException();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    await this.hls.applyJobState(parsed.data.detail.jobId, parsed.data.detail.status);
  }
}
