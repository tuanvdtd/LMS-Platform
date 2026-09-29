import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  // Hiện chưa có code Edge (proxy.ts ở Next 16 chạy Node); giữ theo docs cho route Edge sau này.
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

// Lỗi Server Component / Route Handler.
export const onRequestError = Sentry.captureRequestError;
