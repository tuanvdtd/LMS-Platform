// Option chung cho 3 runtime (client, server, edge). Xem back-end/src/instrument.ts.
import type { BrowserOptions } from '@sentry/nextjs';
import { redactBreadcrumb, redactEvent, redactSpan } from './sentry-redact';

const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development';

export const sentryOptions = {
  // Trống → SDK không gửi gì.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment,
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  // v11 mặc định gửi body/cookie/header… → tắt hết; user chỉ gắn tay (id, role).
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // Token reset nằm trong query /reset-password?token= → xem sentry-redact.ts.
  beforeSend: redactEvent,
  beforeSendSpan: redactSpan,
  beforeBreadcrumb: redactBreadcrumb,
  // satisfies: bắt lỗi gõ sai key; Browser/Node/EdgeOptions cùng kiểu DataCollection.
} satisfies BrowserOptions;
