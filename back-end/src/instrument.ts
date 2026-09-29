// Nạp bằng `node --import ./dist/instrument.js` (ESM): phải chạy trước mọi module
// khác thì SDK mới tự đo được Express/Prisma/ioredis. import env.js để có .env.
import * as Sentry from '@sentry/nestjs';
import { optionalEnv } from './env.js';
import { redactEvent, redactSpan } from './sentry-redact.js';

const environment = optionalEnv('SENTRY_ENVIRONMENT') ?? 'development';

// DSN trống → SDK không gửi gì (dev chưa cấu hình, test, CI).
Sentry.init({
  dsn: optionalEnv('SENTRY_DSN'),
  environment,
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  // v11 mặc định gửi body/cookie/header/biến trong stack/query DB → tắt hết.
  // Body sign-in có mật khẩu, query reset có token. User chỉ gắn tay (id, role).
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // Token reset nằm trong PATH (không phải query) + key redis → che ở span + event lỗi.
  beforeSendSpan: redactSpan,
  beforeSend: redactEvent,
});
