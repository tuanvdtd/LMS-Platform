import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators.js';

// Kiểm tra Sentry (issue, trace, alert Discord). AppModule không nạp ở production.
@Controller('debug-sentry')
export class DebugController {
  @Public()
  @Get()
  fail(): never {
    throw new Error('Sentry debug error');
  }

  // Cần đăng nhập → AuthGuard chạy Sentry.setUser, kiểm tra issue có id + role.
  @Get('authed')
  failAuthed(): never {
    throw new Error('Sentry debug error (authed)');
  }
}
