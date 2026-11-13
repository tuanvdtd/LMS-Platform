import { Controller, Get, Param, Req, Res, StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Public } from '../auth/decorators.js';
import { clientIp, tooManyRequests } from '../common/http.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { CertificatesService } from './certificates.service.js';

type User = AuthSession['user'];

@Controller()
export class CertificatesController {
  constructor(
    private readonly certificates: CertificatesService,
    private readonly redis: RedisService,
  ) {}

  @Get('me/certificates')
  mine(@CurrentUser() user: User) {
    return this.certificates.listMine(user.id);
  }

  // Ai có mã số đều xem được (mã 10 ký tự ngẫu nhiên không đoán được). Giới hạn tần suất để không ai
  // bắt máy chủ dựng ảnh/PDF dồn dập; mức rộng vì trang chứng chỉ tải mỗi thẻ một ảnh.
  private async guard(req: Request) {
    if (!(await rateLimit(this.redis, `rl:cert:${clientIp(req)}`, 120, 60))) throw tooManyRequests();
  }

  @Public()
  @Get('certificates/:serial')
  async info(@Req() req: Request, @Param('serial') serial: string) {
    await this.guard(req);
    return this.certificates.info(serial);
  }

  // Header đặt bằng tay sau khi dựng xong: decorator @Header gắn cả vào phản hồi lỗi, khiến lỗi 404/410 dạng JSON
  // mang Content-Type của ảnh và bị cache.
  @Public()
  @Get('certificates/:serial/image')
  async image(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('serial') serial: string) {
    await this.guard(req);
    const png = await this.certificates.image(serial);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return new StreamableFile(png, { type: 'image/png' });
  }

  @Public()
  @Get('certificates/:serial/pdf')
  async pdf(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('serial') serial: string) {
    await this.guard(req);
    const pdf = await this.certificates.pdf(serial);
    res.setHeader('Cache-Control', 'no-store');
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="chung-chi-${serial}.pdf"`,
    });
  }
}
