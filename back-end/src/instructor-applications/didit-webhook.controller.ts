import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators.js';
import { InstructorApplicationsService } from './instructor-applications.service.js';

// Body là Buffer nhờ express.raw ở setup-app.ts (chữ ký tính trên đúng byte nhận được).
@Public()
@Controller('webhooks')
export class DiditWebhookController {
  constructor(private readonly apps: InstructorApplicationsService) {}

  @Post('didit')
  @HttpCode(200)
  handle(@Req() req: Request, @Headers('x-signature') signature: string | undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    return this.apps.handleDiditWebhook(raw, signature);
  }
}
